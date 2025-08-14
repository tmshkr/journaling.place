#!/bin/bash
set -eox pipefail

source .env

required_env_vars=(
    "BACKUP_BUCKET_NAME"
    "MONGO_URI"
    "TARGET_DOMAIN"
)

for env_var in "${required_env_vars[@]}"; do
    if [[ -z "${!env_var}" ]]; then
        echo "$env_var is required"
        exit 1
    fi
done

docker run --rm \
    -v ./backup:/backup \
    mongo:8.0.12 \
    sh -c "mongodump --uri \"$MONGO_URI\" --gzip --archive=\"/backup/backup.tar.gz\""

# Upload the backup to GCS
gcloud storage cp ./backup/backup.tar.gz gs://$BACKUP_BUCKET_NAME/$TARGET_DOMAIN/backup.tar.gz
