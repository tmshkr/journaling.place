#!/bin/bash
set -e

MANIFEST=$(aws ecr batch-get-image --repository-name journaling.place --image-ids imageTag=$1 --output json | jq --raw-output --join-output '.images[0].imageManifest')

aws ecr put-image --repository-name journaling.place --image-tag $BRANCH --image-manifest "$MANIFEST"