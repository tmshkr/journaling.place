import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

import type { ClusterConfig } from "./config.ts";

/**
 * The Kubernetes provider and target namespace, built the same way in every
 * projects so each stack can be deployed on its own.
 */
export class Cluster {
  readonly provider: k8s.Provider;
  readonly namespace: pulumi.Output<string>;
  /** Resource options every object in the stack is created with. */
  readonly opts: pulumi.CustomResourceOptions;

  constructor(cfg: ClusterConfig) {
    this.provider = new k8s.Provider("k8s", {
      kubeconfig: cfg.kubeconfig,
      context: cfg.kubeContext,
    });
    this.opts = { provider: this.provider };

    this.namespace = cfg.createNamespace
      ? new k8s.core.v1.Namespace(
          cfg.namespace,
          { metadata: { name: cfg.namespace } },
          this.opts,
        ).metadata.name
      : pulumi.output(cfg.namespace);
  }
}
