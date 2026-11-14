import * as pulumi from "@pulumi/pulumi";

/**
 * Settings are read from a short `jp:` namespace rather than the project's own,
 * the same one the oci-k3s `databases/mongodb` project uses.
 */
export const config = new pulumi.Config("jp");

export type ClusterConfig = ReturnType<typeof clusterConfig>;

export function clusterConfig() {
  return {
    /** Kubeconfig contents. Unset uses the ambient one, as in CI. */
    kubeconfig: config.getSecret("kubeconfig"),
    kubeContext: config.get("kubeContext"),
    namespace: config.get("namespace") ?? "default",
    /**
     * Other stacks target the same namespace, so at most one may own it. Off by
     * default, which is right for `default`.
     */
    createNamespace: config.getBoolean("createNamespace") ?? false,
  };
}
