output "service_account_email" {
  value = google_service_account.instance_sa.email
}

output "workload_identity_pool_id" {
  value = google_iam_workload_identity_pool.github_identity_pool.workload_identity_pool_id
}

output "workload_identity_pool_provider_name" {
  # Use this value as GCP_WORKLOAD_IDENTITY_PROVIDER for google-github-actions/auth
  value = google_iam_workload_identity_pool_provider.github_oidc_provider.name
}
