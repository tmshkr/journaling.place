module "iam" {
  source            = "./iam"
  project_id        = var.project_id
  github_repo       = var.github_repo
  resource_name_key = var.resource_name_key
}

module "network" {
  source            = "./network"
  project_id        = var.project_id
  resource_name_key = var.resource_name_key

  depends_on = [module.iam]
}

module "storage" {
  source                = "./storage"
  project_id            = var.project_id
  backup_bucket         = var.backup_bucket
  state_bucket          = var.state_bucket
  resource_name_key     = var.resource_name_key
  service_account_email = module.iam.service_account_email

  depends_on = [module.iam]
}

