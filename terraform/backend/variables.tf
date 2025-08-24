variable "region" {
  description = "The GCP region where resources will be created"
  type        = string
  default     = "US"
}

variable "project_id" {
  description = "The GCP project ID where resources will be created"
  type        = string
}

variable "state_bucket" {
  description = "The GCP bucket name for storing Terraform state"
  type        = string
}
