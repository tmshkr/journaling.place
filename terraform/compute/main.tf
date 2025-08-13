provider "google" {
  project = var.project_id
  zone    = var.zone
}

data "terraform_remote_state" "main_module" {
  backend = "gcs"
  config = {
    bucket = var.state_bucket
    prefix = "terraform/state/shared"
  }
}

resource "google_compute_instance" "vm" {
  name         = terraform.workspace
  machine_type = var.machine_type

  boot_disk {
    initialize_params {
      image = var.disk_image
      size  = 20 # Size in GB
      type  = "pd-standard"
    }
  }

  network_interface {
    network = data.terraform_remote_state.main_module.outputs.vpc_self_link

    access_config {} # Required for external IP
  }

  metadata = {
    "BACKUP_BUCKET_NAME" = data.terraform_remote_state.main_module.outputs.backup_bucket_name
    "DEPLOY_KEY"         = var.deploy_key,
    "EMAIL_FROM"         = var.email_from,
    "EMAIL_SECRET"       = var.email_secret,
    "EMAIL_SERVER"       = var.email_server,
    "GITHUB_ACTOR"       = var.github_actor,
    "GITHUB_REPOSITORY"  = var.github_repository,
    "GITHUB_SHA"         = var.github_sha,
    "MONGO_URI"          = var.mongo_uri,
    "NEXTAUTH_SECRET"    = var.nextauth_secret,
    "NEXTAUTH_URL"       = var.nextauth_url,
    "ORIGIN_CERT"        = var.origin_cert,
    "ORIGIN_KEY"         = var.origin_key,
    "TARGET_DOMAIN"      = var.target_domain,
    "TEST_USER_EMAIL"    = var.test_user_email,
    "VERSION_LABEL"      = var.version_label
  }

  metadata_startup_script = file("../../scripts/terraform/init.sh")

  service_account {
    email  = data.terraform_remote_state.main_module.outputs.service_account_email
    scopes = ["cloud-platform"]
  }

  tags = ["http-server", "https-server", "allow-ssh", "allow-http-8080"]
}


output "instance_name" {
  value = google_compute_instance.vm.name
}

output "instance_ip_address" {
  value = google_compute_instance.vm.network_interface[0].access_config[0].nat_ip
}

