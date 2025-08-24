variable "project_id" {
  description = "The GCP project ID where resources will be created"
  type        = string
}

variable "github_repo" {
  description = "The value provided by $GITHUB_REPOSITORY in GitHub Actions, formatted as 'owner/repo'"
  type        = string
}

variable "resource_name_key" {
  description = "Unique key to use to prevent resource name collisions"
  type        = string
}
