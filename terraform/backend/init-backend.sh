#!/bin/bash

set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

mv backend.tf backend.tf.bak
terraform init                # Initialize Terraform without the remote backend
terraform apply -auto-approve # Create the bucket for remote state storage
mv backend.tf.bak backend.tf
terraform init -backend-config=".tfbackend" -migrate-state # Migrate state to the remote backend
