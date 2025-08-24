#!/bin/bash
set -eox pipefail

source .env

required_env_vars=(
    "BACKUP_BUCKET_NAME"
    "DOCKER_TAG"
    "GITHUB_SHA"
    "MONGO_URI"
    "STAGE"
    "VERSION_LABEL"
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

GIT_SHA=$(git rev-parse HEAD)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

metadata_json=$(jq -n \
    --arg docker_tag "$DOCKER_TAG" \
    --arg github_sha "$GITHUB_SHA" \
    --arg git_sha "${GIT_SHA:-}" \
    --arg git_branch "${GIT_BRANCH:-}" \
    --arg version_label "${VERSION_LABEL:-}" \
    --arg comment "${1:-No comment provided}" \
    '{
    DOCKER_TAG: $docker_tag,
    GITHUB_SHA: $github_sha,
    GIT_SHA: $git_sha,
    GIT_BRANCH: $git_branch,
    VERSION_LABEL: $version_label,
    COMMENT: $comment
  }')

# Upload the backup to S3 with JSON metadata
aws s3 cp ./backup/backup.tar.gz s3://${BACKUP_BUCKET_NAME}/${STAGE}/backup.tar.gz --metadata "${metadata_json}"
