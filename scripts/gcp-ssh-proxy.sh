#!/bin/bash
set -eo pipefail

# Navigate to the project root
cd "$(dirname "${BASH_SOURCE[0]}")/.."

if [[ -f .env ]]; then
    echo "Loading environment variables from .env file..."
    source .env
fi

required_env_vars=(
    "CLOUDFLARE_API_TOKEN"
    "CLOUDFLARE_ZONE_ID"
    "BLUE_ENV"
    "GREEN_ENV"
    "TARGET_DOMAIN"
)

for env_var in "${required_env_vars[@]}"; do
    if [[ -z "${!env_var}" ]]; then
        echo "$env_var is required"
        exit 1
    fi
done

dns_records=$(curl -s https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN")
target_ip=$(echo "$dns_records" | jq -r --arg TARGET_DOMAIN "$TARGET_DOMAIN" '.result[] | select(.name == $TARGET_DOMAIN and .type == "A") | .content')

if [[ -z "$target_ip" ]]; then
    echo "No A record found for $TARGET_DOMAIN"
    exit 1
fi

cd terraform/compute
terraform workspace select -or-create=true $BLUE_ENV >/dev/null
blue_ip=$(terraform state pull | jq -r '.outputs.instance_ip_address.value')
terraform workspace select -or-create=true $GREEN_ENV >/dev/null
green_ip=$(terraform state pull | jq -r '.outputs.instance_ip_address.value')
echo "blue_ip: $blue_ip"
echo "green_ip: $green_ip"

target_workspace=""

if [[ "$target_ip" == "$blue_ip" ]]; then
    target_workspace=$BLUE_ENV
elif [[ "$target_ip" == "$green_ip" ]]; then
    target_workspace=$GREEN_ENV
fi

if [[ -z "$target_workspace" ]]; then
    echo "No suitable workspace found for $TARGET_DOMAIN."
    exit 1
fi

gcloud compute start-iap-tunnel $target_workspace 22 --listen-on-stdin --project=noumenal-dev --zone="$GCP_ZONE" --verbosity=warning
