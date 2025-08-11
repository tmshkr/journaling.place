#!/bin/bash
set -eo pipefail

if [[ -f .env ]]; then
    mv .env $(date +%s).env
fi

attributes=$(curl -s -H "Metadata-Flavor: Google" \
    "http://metadata.google.internal/computeMetadata/v1/instance/attributes/?recursive=true")

for key in $(echo "$attributes" | jq -r 'keys[]'); do
    if [[ "$key" == "startup-script" || "$key" == "ssh-keys" ]]; then
        continue
    fi
    value=$(echo "$attributes" | jq -r --arg k "$key" '.[$k]')
    echo "$key=\"$value\"" >>.env
done

source .env

echo "$ORIGIN_CERT" | base64 -d >./cf-cert.pem
echo "$ORIGIN_KEY" | base64 -d >./cf-key.pem
