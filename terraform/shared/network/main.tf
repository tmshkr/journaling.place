data "http" "cloudflare_ipv4_ranges" {
  url = "https://www.cloudflare.com/ips-v4/"
}

resource "google_compute_network" "vpc" {
  name                    = "journaling-place-vpc-${var.resource_name_key}"
  auto_create_subnetworks = true
}

resource "google_compute_firewall" "allow-http" {
  name    = "allow-http"
  network = google_compute_network.vpc.self_link

  allow {
    protocol = "tcp"
    ports    = ["80"]
  }

  source_ranges = split("\n", data.http.cloudflare_ipv4_ranges.response_body)
  target_tags   = ["http-server"]
}

resource "google_compute_firewall" "allow-https" {
  name    = "allow-https"
  network = google_compute_network.vpc.self_link

  allow {
    protocol = "tcp"
    ports    = ["443"]
  }

  source_ranges = split("\n", data.http.cloudflare_ipv4_ranges.response_body)
  target_tags   = ["https-server"]
}

resource "google_compute_firewall" "allow-ssh" {
  name    = "allow-ssh"
  network = google_compute_network.vpc.self_link

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["35.235.240.0/20"] # IAP IP ranges
  target_tags   = ["allow-ssh"]
}
