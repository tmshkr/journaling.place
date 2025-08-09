variable "project_id" {
  description = "The GCP project ID where resources will be created"
  type        = string
}

variable "zone" {
  type        = string
  description = "The GCP zone where the VM instance will be created"
  default     = "us-central1-a"
}

variable "machine_type" {
  default = "e2-micro"
}

variable "disk_image" {
  default = "ubuntu-2504-plucky-amd64-v20250701"
}

variable "state_bucket" {
  description = "The GCS bucket for storing Terraform state files"
  type        = string
}

variable "github_actor" {
  description = "GitHub actor for the deployment"
  type        = string
}

variable "github_repository" {
  description = "GitHub repository for the deployment"
  type        = string
}

variable "github_sha" {
  description = "GitHub SHA for the deployment"
  type        = string
}

variable "deploy_key" {
  description = "Base64-encoded GitHub deploy key for the repository"
  type        = string
  sensitive   = true
}

variable "origin_cert" {
  description = "Base64-encoded origin certificate"
  type        = string
  sensitive   = true
}

variable "origin_key" {
  description = "Base64-encoded origin key"
  type        = string
  sensitive   = true
}

variable "target_domain" {
  description = "FQDN for the target domain, e.g., example.com"
  type        = string
}
