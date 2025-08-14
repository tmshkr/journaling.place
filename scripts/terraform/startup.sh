#!/bin/bash

set -eox pipefail
APP_DIR=$(pwd)
./scripts/terraform/get-env-from-metadata.sh

source .env

# Create a swapfile if it hasn't been created yet.
if [[ ! -f /swapfile ]]; then
    fallocate -l 2G /swapfile
    chmod 0600 /swapfile
    /sbin/mkswap /swapfile
    /sbin/swapon /swapfile
    echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab
    echo "Swap file created and enabled."
else
    echo "Swap file already exists, skipping creation."
fi

sudo apt-get update
sudo apt-get install -y zip unzip

# Install Docker.
# https://docs.docker.com/engine/install/ubuntu/

if ! command -v docker &>/dev/null; then
    echo "Docker not found, installing..."
    cd $(mktemp -d)
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh ./get-docker.sh
    cd "$APP_DIR"
else
    echo "Docker is already installed."
fi

# Setup backup cron job.
if [[ -f /etc/cron.d/backup ]]; then
    echo "Backup cron job already exists, skipping creation."
else
    echo "Creating backup cron job..."
    echo "0 5 * * * root cd $APP_DIR && ./scripts/backup.sh" | tee /etc/cron.d/backup
    chmod 644 /etc/cron.d/backup
    systemctl restart cron
    systemctl daemon-reload
    echo "Backup cron job created."
fi

# Pull image from Docker Hub
while ! docker pull tmshkr/journaling.place:$DOCKER_TAG; do
    echo "Retrying Docker pull..."
    sleep 10
done

# Stop server
docker compose -f docker-compose.yml -f docker-compose.gcp.yml stop

# Start server
docker compose -f docker-compose.yml -f docker-compose.gcp.yml up -d
