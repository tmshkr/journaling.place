#!/bin/bash -e

GIT_REF_NAME=$(git rev-parse --abbrev-ref HEAD)

scripts/atlas-access.js open

gh workflow run deploy.yaml \
  -f environment=staging \
  --ref $GIT_REF_NAME

gh workflow view deploy.yaml -w
