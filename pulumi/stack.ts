import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

import { Cluster } from "./lib/cluster.ts";
import { clusterConfig, config } from "./lib/config.ts";

const here = path.dirname(fileURLToPath(import.meta.url));

/** Caddy listens here and fans out to Next.js and the tRPC server on localhost. */
const CADDY_PORT = 8080;
const NEXT_PORT = 3000;
const TRPC_PORT = 3333;

/**
 * One environment of journaling.place: what the `k8s/app` Helm chart rendered,
 * plus the Ingress `deploy.sh` applied with envsubst.
 *
 * One stack per environment (`staging`, `production`), and every object is
 * named `jp-<stack>`. Helm made a new `jp-<version>` release for each build and
 * repointed the Ingress at it, leaving the old releases behind; here a new
 * version is a rolling update of the one Deployment, gated by its readiness
 * probe.
 *
 * The image is not built here. CI builds and pushes it to Docker Hub, and the
 * stack is told which tag to run with `versionLabel`.
 *
 * The database is not managed here either: `mongoUri` is a connection string,
 * so this stack depends on no other.
 */
export class AppStack {
  config = AppStack.getConfig();
  outputs: Record<string, pulumi.Output<unknown>>;

  constructor() {
    const cfg = this.config;

    const cluster = new Cluster(cfg.cluster);
    const { namespace, opts } = cluster;

    const name = `jp-${pulumi.getStack()}`;
    const labels = {
      "app.kubernetes.io/name": "journaling-place",
      "app.kubernetes.io/instance": name,
    };
    const image = `${cfg.imageRepository}:${cfg.versionLabel}`;

    const env = {
      EMAIL_FROM: cfg.emailFrom,
      NEXTAUTH_URL: cfg.nextauthUrl,
      PRISMA_QUERY_ENGINE_LIBRARY: cfg.prismaQueryEngineLibrary,
      TEST_USER_EMAIL: cfg.testUserEmail,
      // Served by /api/info; the e2e setup polls it to know the rollout is done.
      VERSION_LABEL: cfg.versionLabel,
    };
    const secretEnv = {
      EMAIL_SECRET: cfg.emailSecret,
      EMAIL_SERVER: cfg.emailServer,
      MONGO_URI: cfg.mongoUri,
      NEXTAUTH_SECRET: cfg.nextauthSecret,
    };
    const caddyfile = readFileSync(path.join(here, "Caddyfile"), "utf8");

    const configMap = new k8s.core.v1.ConfigMap(
      `${name}-config`,
      { metadata: { name: `${name}-config`, namespace, labels }, data: env },
      opts,
    );

    // Kept out of the env ConfigMap: Helm had the Caddyfile in the same one,
    // which also handed it to Next.js as an environment variable.
    const caddyConfig = new k8s.core.v1.ConfigMap(
      `${name}-caddy`,
      { metadata: { name: `${name}-caddy`, namespace, labels }, data: { Caddyfile: caddyfile } },
      opts,
    );

    const secret = new k8s.core.v1.Secret(
      `${name}-secrets`,
      {
        metadata: { name: `${name}-secrets`, namespace, labels },
        type: "Opaque",
        stringData: secretEnv,
      },
      opts,
    );

    // The ConfigMaps and the Secret keep their names when their contents
    // change, so nothing in the pod template would. This rolls the pods anyway.
    // It is a digest of secret values, not the values, so it is safe to show.
    const checksum = pulumi.unsecret(
      pulumi
        .all([env, secretEnv, caddyfile])
        .apply((parts) => createHash("sha256").update(JSON.stringify(parts)).digest("hex")),
    );

    const deployment = new k8s.apps.v1.Deployment(
      name,
      {
        metadata: { name, namespace, labels },
        spec: {
          replicas: cfg.replicas,
          selector: { matchLabels: labels },
          template: {
            metadata: { labels, annotations: { "checksum/config": checksum } },
            spec: {
              // Nothing in the pod talks to the Kubernetes API.
              automountServiceAccountToken: false,
              volumes: [{ name: "caddy", configMap: { name: caddyConfig.metadata.name } }],
              containers: [
                {
                  name: "caddy",
                  image: "caddy:2",
                  args: ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"],
                  ports: [{ name: "caddy-http", containerPort: CADDY_PORT, protocol: "TCP" }],
                  volumeMounts: [
                    {
                      name: "caddy",
                      mountPath: "/etc/caddy/Caddyfile",
                      subPath: "Caddyfile",
                      readOnly: true,
                    },
                  ],
                  resources: {
                    requests: { cpu: "100m", memory: "128Mi" },
                    limits: { cpu: "250m", memory: "256Mi" },
                  },
                  securityContext: {
                    allowPrivilegeEscalation: false,
                    readOnlyRootFilesystem: true,
                  },
                },
                {
                  name: "nextjs",
                  image,
                  imagePullPolicy: "IfNotPresent",
                  // The repo-root script: `prisma db push`, `prisma db seed`,
                  // then `turbo run start`.
                  command: ["npm", "run", "start"],
                  ports: [
                    { name: "nextjs", containerPort: NEXT_PORT, protocol: "TCP" },
                    { name: "trpc", containerPort: TRPC_PORT, protocol: "TCP" },
                  ],
                  envFrom: [
                    { configMapRef: { name: configMap.metadata.name } },
                    { secretRef: { name: secret.metadata.name } },
                  ],
                  livenessProbe: { httpGet: { path: "/", port: "nextjs" } },
                  readinessProbe: { httpGet: { path: "/", port: "nextjs" } },
                },
              ],
            },
          },
        },
      },
      opts,
    );

    const service = new k8s.core.v1.Service(
      name,
      {
        metadata: { name, namespace, labels },
        spec: {
          type: "ClusterIP",
          ports: [
            { name: "caddy-http", port: CADDY_PORT, targetPort: "caddy-http", protocol: "TCP" },
          ],
          selector: labels,
        },
      },
      { ...opts, dependsOn: [deployment] },
    );

    // Named after its host, as cf-ingress.template.yaml named it. Only one
    // stack may hold a given domain.
    const ingress = cfg.ingressEnabled
      ? new k8s.networking.v1.Ingress(
          cfg.domain,
          {
            metadata: { name: cfg.domain, namespace, labels },
            spec: {
              ingressClassName: cfg.ingressClassName,
              rules: [
                {
                  host: cfg.domain,
                  http: {
                    paths: [
                      {
                        path: "/",
                        pathType: "Prefix",
                        backend: {
                          service: { name: service.metadata.name, port: { number: CADDY_PORT } },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          opts,
        )
      : undefined;

    this.outputs = {
      image: pulumi.output(image),
      versionLabel: pulumi.output(cfg.versionLabel),
      namespace,
      deploymentName: deployment.metadata.name,
      serviceName: service.metadata.name,
      host: pulumi.output(cfg.domain),
      url: pulumi.output(cfg.nextauthUrl),
      ingressName: ingress ? ingress.metadata.name : pulumi.output(null),
    };
  }

  static getConfig() {
    const domain = config.require("domain");

    return {
      cluster: clusterConfig(),

      // --- release ---
      /** Docker Hub repository CI pushes to. Public, so no pull secret. */
      imageRepository: config.get("imageRepository") ?? "tmshkr/journaling.place",
      /** The image tag to run, `<branch>-<sha>` from scripts/turbo-sha.mjs. */
      versionLabel: config.require("versionLabel"),
      replicas: config.getNumber("replicas") ?? 1,

      // --- routing ---
      /** The host this environment serves. One stack per domain. */
      domain,
      ingressEnabled: config.getBoolean("ingressEnabled") ?? true,
      ingressClassName: config.get("ingressClassName") ?? "cloudflare-tunnel",

      // --- app ---
      nextauthUrl: config.get("nextauthUrl") ?? `https://${domain}`,
      nextauthSecret: config.requireSecret("nextauthSecret"),
      mongoUri: config.requireSecret("mongoUri"),
      emailFrom: config.require("emailFrom"),
      emailSecret: config.requireSecret("emailSecret"),
      emailServer: config.requireSecret("emailServer"),
      testUserEmail: config.require("testUserEmail"),
      /** Matches the image: built for arm64 against OpenSSL 3. */
      prismaQueryEngineLibrary:
        config.get("prismaQueryEngineLibrary") ??
        "/app/node_modules/@prisma/engines/libquery_engine-linux-arm64-openssl-3.0.x.so.node",
    };
  }
}
