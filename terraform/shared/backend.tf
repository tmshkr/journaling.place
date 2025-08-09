terraform {
  backend "gcs" {
    prefix = "terraform/state/shared"
  }
}
