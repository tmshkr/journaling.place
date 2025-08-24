variable "project_id" {
  description = "The GCP project ID where resources will be created"
  type        = string
}

variable "backup_bucket" {
  description = "The name of the backup storage bucket"
  type        = string
}

variable "resource_name_key" {
  description = "Unique key to use to prevent resource name collisions"
  type        = string
}

variable "state_bucket" {
  description = "The name of the GCS bucket used for storing Terraform state"
  type        = string
}

variable "service_account_email" {
  description = "Email of the service account that will access the storage bucket"
  type        = string
}
