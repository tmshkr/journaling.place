#!/bin/bash
set -eox pipefail

if [[ -f .env ]]; then
    echo "Loading environment variables from .env file..."
    source .env
fi

required_env_vars=(
    "BLUE_ENV"
    "CLOUDFLARE_API_TOKEN"
    "CLOUDFLARE_ZONE_ID"
    "GREEN_ENV"
    "GCP_ZONE"
    "PRODUCTION_DOMAIN"
    "STAGING_DOMAIN"
    "WP_DOMAIN"
)

for env_var in "${required_env_vars[@]}"; do
    if [[ -z "${!env_var}" ]]; then
        echo "$env_var is required"
        exit 1
    fi
done

sh -c "scripts/terraform/select-staging-workspace.sh"
cd terraform/compute

staging_workspace=$(terraform workspace show)
staging_state=$(terraform state pull)
staging_ip=$(echo "$staging_state" | jq -r '.outputs.instance_ip_address.value')
if [[ -z "$staging_ip" ]]; then
    echo "No staging IP address found in the Terraform state."
    exit 1
fi

# Update metadata for the staging instance
gcloud compute instances add-metadata "$staging_workspace" \
    --zone "$GCP_ZONE" \
    --metadata "WP_DOMAIN=$WP_DOMAIN"

gcloud compute ssh --tunnel-through-iap --zone "$GCP_ZONE" "$staging_workspace" --command "cd /srv/$GITHUB_REPOSITORY && sudo sh -c './scripts/get-env-from-metadata.sh && docker compose stop && docker compose -f docker-compose.yml -f docker-compose.gcp.yml up -d'"

dns_records=$(curl -s https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN")
prod_record_id=$(echo "$dns_records" | jq -r '.result[] | select(.name == "'"$PRODUCTION_DOMAIN"'" and .type == "A") | .id')

if [[ -z "$prod_record_id" ]]; then
    echo "No DNS record found for $PRODUCTION_DOMAIN, creating a new one."
    response=$(curl -s https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records \
        -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        --data '{
            "type": "A",
            "name": "'"$PRODUCTION_DOMAIN"'",
            "content": "'"$staging_ip"'",
            "ttl": 1,
            "proxied": true
        }')
else
    echo "Updating existing DNS record for $PRODUCTION_DOMAIN."
    response=$(curl -s "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records/$prod_record_id" \
        -X PATCH \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        --data '{
            "type": "A",
            "name": "'"$PRODUCTION_DOMAIN"'",
            "content": "'"$staging_ip"'",
            "ttl": 1,
            "proxied": true
        }')
fi

if [[ $(echo "$response" | jq -r '.success') == "true" ]]; then
    echo "DNS records updated for $PRODUCTION_DOMAIN to point to $staging_ip"
else
    echo "Failed to update DNS record for $PRODUCTION_DOMAIN"
    exit 1
fi

echo "Deleting old staging DNS records..."

staging_record_id=$(echo "$dns_records" | jq -r '.result[] | select(.name == "'"$STAGING_DOMAIN"'" and .type == "A") | .id')
if [[ -n "$staging_record_id" ]]; then
    delete_response=$(curl -s "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records/$staging_record_id" \
        -X DELETE \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN")
    if [[ $(echo "$delete_response" | jq -r '.success') == "true" ]]; then
        echo "DNS record for $STAGING_DOMAIN deleted successfully."
    else
        echo "Failed to delete DNS record for $STAGING_DOMAIN"
        exit 1
    fi
else
    echo "No DNS record found for $STAGING_DOMAIN."
fi
