output "backup_bucket_name" {
  value = module.storage.backup_bucket_name
}

output "service_account_email" {
  value = module.iam.service_account_email
}

output "workload_identity_pool_provider_name" {
  # Use this value as GCP_WORKLOAD_IDENTITY_PROVIDER for google-github-actions/auth
  value = module.iam.workload_identity_pool_provider_name
}

output "vpc_self_link" {
  value = module.network.vpc_self_link
}
