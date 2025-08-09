#!/bin/bash
set -eo pipefail

# This script selects the staging workspace based on the current DNS records,
# ensuring that it does not target the production workspace.
if [[ -f .env ]]; then
    echo "Loading environment variables from .env file..."
    source .env
fi

required_env_vars=(
    "CLOUDFLARE_API_TOKEN"
    "CLOUDFLARE_ZONE_ID"
    "BLUE_ENV"
    "GREEN_ENV"
    "STAGING_DOMAIN"
    "PRODUCTION_DOMAIN"
)

for env_var in "${required_env_vars[@]}"; do
    if [[ -z "${!env_var}" ]]; then
        echo "$env_var is required"
        exit 1
    fi
done

dns_records=$(curl -s https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN")
staging_ip=$(echo "$dns_records" | jq -r --arg STAGING_DOMAIN "$STAGING_DOMAIN" '.result[] | select(.name == $STAGING_DOMAIN and .type == "A") | .content')
production_ip=$(echo "$dns_records" | jq -r --arg PRODUCTION_DOMAIN "$PRODUCTION_DOMAIN" '.result[] | select(.name == $PRODUCTION_DOMAIN and .type == "A") | .content')

echo "staging_ip: $staging_ip"
echo "production_ip: $production_ip"

cd terraform/compute
terraform workspace select -or-create=true $BLUE_ENV >/dev/null
blue_ip=$(terraform state pull | jq -r '.outputs.instance_ip_address.value')
terraform workspace select -or-create=true $GREEN_ENV >/dev/null
green_ip=$(terraform state pull | jq -r '.outputs.instance_ip_address.value')
echo "blue_ip: $blue_ip"
echo "green_ip: $green_ip"

# Determine the staging workspace based on the IP addresses,
# selecting the one that matches the staging IP,
# or else one that does not match the production IP.
staging_workspace=""
if [[ "$staging_ip" == "$blue_ip" && "$production_ip" != "$blue_ip" ]]; then
    staging_workspace=$BLUE_ENV
elif [[ "$staging_ip" == "$green_ip" && "$production_ip" != "$green_ip" ]]; then
    staging_workspace=$GREEN_ENV
elif [[ "$production_ip" != "$blue_ip" ]]; then
    staging_workspace=$BLUE_ENV
elif [[ "$production_ip" != "$green_ip" ]]; then
    staging_workspace=$GREEN_ENV
fi

if [[ -z "$staging_workspace" ]]; then
    echo "No suitable workspace found for staging."
    exit 1
fi

echo "Using $staging_workspace for staging."
terraform workspace select $staging_workspace
