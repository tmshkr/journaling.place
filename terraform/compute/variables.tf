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

variable "docker_tag" {
  description = "Docker image tag to use for the deployment"
  type        = string
}

variable "email_from" {
  description = "Email address to use as the sender for login emails"
  type        = string
}

variable "email_secret" {
  description = "Email JWT secret"
  type        = string
  sensitive   = true
}

variable "email_server" {
  description = "SMTP connection string to send emails"
  type        = string
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

variable "mongo_uri" {
  description = "MongoDB connection string"
  type        = string
  sensitive   = true
}

variable "deploy_key" {
  description = "Base64-encoded GitHub deploy key for the repository"
  type        = string
  sensitive   = true
}

variable "nextauth_secret" {
  description = "NextAuth.js secret"
  type        = string
  sensitive   = true
}

variable "nextauth_url" {
  description = "NextAuth.js URL"
  type        = string
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

variable "test_user_email" {
  description = "Email address for the test user"
  type        = string
}

variable "version_label" {
  description = "Version label for the deployment, e.g., main.30cc3f51a9a6e885d885e376d249717c95d4cb72"
  type        = string
}
