# Pulumi deployment

Pulumi project `journaling-place`: the app on Kubernetes. It replaces the
Skaffold + Helm setup that used to live in `k8s/app`, now removed.

## What gets created

One stack per environment (`staging`, `production`). Every object is named
`jp-<stack>`.

| Resource | Notes |
| --- | --- |
| `Deployment` `jp-<stack>` | Two containers: `caddy` on 8080 in front of `nextjs` (Next.js on 3000, tRPC on 3333). Runs `tmshkr/journaling.place:<versionLabel>` |
| `Service` `jp-<stack>` | ClusterIP, 8080 to Caddy |
| `ConfigMap` `jp-<stack>-config`, `Secret` `jp-<stack>-secrets` | The app's environment |
| `ConfigMap` `jp-<stack>-caddy` | [`Caddyfile`](Caddyfile) |
| `Ingress` `<domain>` | `ingressClassName: cloudflare-tunnel`. Skipped when `ingressEnabled` is `false` |

Outputs: `image`, `versionLabel`, `namespace`, `deploymentName`, `serviceName`,
`host`, `url` and `ingressName`.

## What changed from Helm

- **Releases.** Helm installed a new `jp-<version>` release per build and
  repointed the Ingress at it, leaving the old releases in the cluster. Here a
  new `versionLabel` is a rolling update of the one `jp-<stack>` Deployment; the
  old pod stays until the new one passes its readiness probe.
- **Restarts on config changes.** The pod template carries a checksum of the
  config and secret values, so changing one rolls the pods.
- **No ServiceAccount.** The chart created one and mounted its token; nothing
  in the pod uses the Kubernetes API, so the pod runs as `default` with no
  token mounted.
- **The Caddyfile has its own ConfigMap** rather than sharing the env one.

The image is still built and pushed to Docker Hub by the workflow, not by
Pulumi. The database is not part of this project: `mongoUri` is a connection
string.

## Deploying from GitHub

`.github/workflows/k8s-deploy.yaml` builds the image, then runs, for the chosen
environment:

```bash
pulumi stack select <environment> --create
node set-config.mjs --from-env --stack <environment>
pulumi up --yes --stack <environment>
```

It needs one secret the Helm setup did not: **`PULUMI_ACCESS_TOKEN`**. The
cluster comes from the existing `KUBECONFIG` secret, which the workflow writes
to `~/.kube/config`; the stack's `kubeconfig` key is left unset so that is what
Pulumi uses.

## Deploying by hand

```bash
cd pulumi
npm install
pulumi stack select staging --create

cp .env.example .env
$EDITOR .env
npm run config -- --dry-run
npm run config
npm run up
```

## Config keys

All keys live in the `jp:` namespace.

| Key | Variable | Required | Default | Purpose |
| --- | --- | --- | --- | --- |
| `versionLabel` | `VERSION_LABEL` | yes | — | Image tag to run; also served by `/api/info` |
| `imageRepository` | `IMAGE_REPOSITORY` | no | `tmshkr/journaling.place` | Docker Hub repository |
| `replicas` | `REPLICAS` | no | `1` | |
| `domain` | `TARGET_DOMAIN` | yes | — | Host served; names the Ingress |
| `ingressEnabled` | `INGRESS_ENABLED` | no | `true` | |
| `ingressClassName` | `INGRESS_CLASS_NAME` | no | `cloudflare-tunnel` | |
| `nextauthUrl` | `NEXTAUTH_URL` | no | `https://<domain>` | |
| `nextauthSecret` | `NEXTAUTH_SECRET` | yes (secret) | — | |
| `mongoUri` | `MONGO_URI` | yes (secret) | — | MongoDB connection string |
| `emailFrom` | `EMAIL_FROM` | yes | — | |
| `emailSecret` | `EMAIL_SECRET` | yes (secret) | — | |
| `emailServer` | `EMAIL_SERVER` | yes (secret) | — | SMTP connection string |
| `testUserEmail` | `TEST_USER_EMAIL` | yes | — | |
| `prismaQueryEngineLibrary` | `PRISMA_QUERY_ENGINE_LIBRARY` | no | arm64 / OpenSSL 3 engine path | |
| `kubeconfig` | `KUBECONFIG` | no (secret) | ambient | Kubeconfig contents |
| `kubeContext` | `KUBE_CONTEXT` | no | current | Context within the kubeconfig |
| `namespace` | `K8S_NAMESPACE` | no | `default` | Target namespace |
| `createNamespace` | `CREATE_NAMESPACE` | no | `false` | Only if no other stack owns the namespace |

## Notes

- Only one stack may hold a given `domain`: the Ingress is named after it. To
  move a domain between stacks, take it off the outgoing one first.
- An Ingress or `jp-<version>` release left behind by the Helm setup is not
  adopted. If one exists for the same domain, `pulumi up` fails on the Ingress
  name; delete the old one (or `pulumi import` it) first.
