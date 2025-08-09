resource "google_storage_bucket" "backup_bucket" {
  name     = "${var.backup_bucket}-${var.resource_name_key}"
  location = "US"
  project  = var.project_id

  force_destroy = false

  lifecycle_rule {
    action {
      type = "Delete"
    }

    condition {
      days_since_noncurrent_time = 90
    }
  }

  versioning {
    enabled = true
  }
}

resource "google_storage_bucket_iam_member" "rw_access" {
  bucket = google_storage_bucket.backup_bucket.name
  role   = "roles/storage.objectUser"
  member = "serviceAccount:${var.service_account_email}"
}
