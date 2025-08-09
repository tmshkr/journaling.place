variable "project_id" {
  description = "The GCP project ID where resources will be created"
  type        = string
}

variable "resource_name_key" {
  description = "Unique key to use to prevent resource name collisions"
  type        = string
}
