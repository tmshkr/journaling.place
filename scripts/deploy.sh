#!/bin/bash -e

GIT_REF_NAME=$(git rev-parse --abbrev-ref HEAD)

scripts/atlas-access.js open

gh workflow run deploy.yaml \
  --ref $GIT_REF_NAME

gh workflow view deploy.yaml -w
