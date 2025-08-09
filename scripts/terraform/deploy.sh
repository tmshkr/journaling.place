#!/bin/bash
set -eo pipefail

if [[ -f .env ]]; then
    echo "Loading environment variables from .env file..."
    source .env
fi

required_env_vars=(
    "BLUE_ENV"
    "CLOUDFLARE_API_TOKEN"
    "CLOUDFLARE_ZONE_ID"
    "DEPLOY_KEY"
    "GCP_PROJECT_ID"
    "GCP_ZONE"
    "GREEN_ENV"
    "GITHUB_ACTOR"
    "GITHUB_REPOSITORY"
    "GITHUB_SHA"
    "ORIGIN_CERT"
    "ORIGIN_KEY"
    "PRODUCTION_DOMAIN"
    "STAGING_DOMAIN"
    "TF_STATE_BUCKET"
)

for env_var in "${required_env_vars[@]}"; do
    if [[ -z "${!env_var}" ]]; then
        echo "$env_var is required"
        exit 1
    fi
done

sh -c "scripts/terraform/select-staging-workspace.sh"
cd terraform/compute
terraform apply -auto-approve \
    -var "deploy_key=$DEPLOY_KEY" \
    -var "github_actor=$GITHUB_ACTOR" \
    -var "github_repository=$GITHUB_REPOSITORY" \
    -var "github_sha=$GITHUB_SHA" \
    -var "project_id=$GCP_PROJECT_ID" \
    -var "origin_cert=$ORIGIN_CERT" \
    -var "origin_key=$ORIGIN_KEY" \
    -var "state_bucket=$TF_STATE_BUCKET" \
    -var "wp_domain=$WP_DOMAIN" \
    -var "zone=$GCP_ZONE"

staging_ip=$(terraform state pull | jq -r '.outputs.instance_ip_address.value')
staging_workspace=$(terraform workspace show)
dns_records=$(curl -s https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN")
staging_dns_record_id=$(echo "$dns_records" | jq -r '.result[] | select(.name == "'"$STAGING_DOMAIN"'" and .type == "A") | .id')

if [[ -z "$staging_dns_record_id" ]]; then
    echo "No DNS record found for $STAGING_DOMAIN, creating a new one."
    response=$(curl -s https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records \
        -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        --data '{
            "type": "A",
            "name": "'"$STAGING_DOMAIN"'",
            "content": "'"$staging_ip"'",
            "ttl": 1,
            "proxied": true
        }')
else
    echo "Updating existing DNS record for $STAGING_DOMAIN."
    response=$(curl -s "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records/$staging_dns_record_id" \
        -X PATCH \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        --data '{
            "type": "A",
            "name": "'"$STAGING_DOMAIN"'",
            "content": "'"$staging_ip"'",
            "ttl": 1,
            "proxied": true
        }')
fi

if [[ $(echo "$response" | jq -r '.success') == "true" ]]; then
    echo "DNS records updated for $STAGING_DOMAIN to point to $staging_ip"
else
    echo "Failed to update DNS record for $STAGING_DOMAIN"
    exit 1
fi
