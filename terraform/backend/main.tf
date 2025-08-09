resource "google_storage_bucket" "state_bucket" {
  name     = var.state_bucket
  location = var.region
  project  = var.project_id

  force_destroy               = false
  public_access_prevention    = "enforced"
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }
}
