#!/bin/bash -e

if [ "$GITHUB_ACTIONS" == "true" ]; then
    docker run --rm -v ./export:/app/export "$DOCKER_IMAGE:builder" scripts/docker-export.sh
    echo "On host machine..."
    echo "Deleting existing .turbo directory"
    rm -rvf .turbo
    echo "Copying exported .turbo directory to $(pwd)/.turbo"
    cp -vR export/.turbo .
    echo "Copying exported .next/static directory to S3..."
    aws s3 cp --recursive export/.next/static s3://$CDN_BUCKET/_next/
else
    echo "Inside Docker container..."
    mkdir -pv export/.turbo export/.next
    cp -vR .turbo export
    cp -vR apps/web/.next/standalone/apps/web/.next/static export/.next
fi
