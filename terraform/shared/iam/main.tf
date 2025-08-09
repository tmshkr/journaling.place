resource "google_iam_workload_identity_pool" "github_identity_pool" {
  workload_identity_pool_id = "github-identity-pool-${var.resource_name_key}"
}

resource "google_iam_workload_identity_pool_provider" "github_oidc_provider" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_identity_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-oidc-provider-${var.resource_name_key}"
  attribute_condition                = "assertion.repository == '${var.github_repo}'"
  attribute_mapping = {
    "google.subject"             = "assertion.sub",
    "attribute.actor"            = "assertion.actor",
    "attribute.repository"       = "assertion.repository",
    "attribute.repository_owner" = "assertion.repository_owner"
  }
  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}


resource "google_project_iam_custom_role" "gha_service_role" {
  role_id     = "ghaServiceRole_${var.resource_name_key}"
  title       = "GitHub Actions Service Role"
  description = "Custom service role for GitHub Actions"

  permissions = [
    "compute.disks.create",
    "compute.firewalls.create",
    "compute.firewalls.delete",
    "compute.firewalls.get",
    "compute.images.get",
    "compute.instanceGroupManagers.get",
    "compute.instances.create",
    "compute.instances.delete",
    "compute.instances.get",
    "compute.instances.osLogin",
    "compute.instances.setLabels",
    "compute.instances.setMetadata",
    "compute.instances.setServiceAccount",
    "compute.instances.setTags",
    "compute.machineTypes.get",
    "compute.networks.create",
    "compute.networks.delete",
    "compute.networks.get",
    "compute.networks.updatePolicy",
    "compute.projects.get",
    "compute.subnetworks.create",
    "compute.subnetworks.delete",
    "compute.subnetworks.get",
    "compute.subnetworks.setPrivateIpGoogleAccess",
    "compute.subnetworks.update",
    "compute.subnetworks.use",
    "compute.subnetworks.useExternalIp",
    "compute.zones.get",
    "iam.serviceAccounts.get",
    "iam.serviceAccounts.actAs",
    "iap.tunnelInstances.accessViaIAP",
    "storage.objects.list",
    "storage.objects.get",
    "storage.objects.create",
    "storage.objects.delete",
    "storage.objects.update",
  ]
}

resource "google_project_iam_binding" "identity_pool_binding" {
  role    = google_project_iam_custom_role.gha_service_role.name
  project = var.project_id

  members = [
    "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github_identity_pool.name}/attribute.repository/${var.github_repo}",
  ]
}

resource "google_service_account" "instance_sa" {
  account_id   = "instance-sa-${var.resource_name_key}"
  display_name = "Instance Service Account"
}

resource "google_project_iam_custom_role" "instance_service_role" {
  role_id     = "instanceServiceRole_${var.resource_name_key}"
  title       = "Instance Service Role"
  description = "Custom service role for GCE instances"

  permissions = [
    "logging.logEntries.create"
  ]
}

resource "google_project_iam_binding" "instance_service_role_binding" {
  role    = google_project_iam_custom_role.instance_service_role.name
  project = var.project_id

  members = [
    "serviceAccount:${google_service_account.instance_sa.email}",
  ]
}
