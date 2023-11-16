#!/bin/bash
set -e
source .env

echo "Building Docker image..."

docker build --build-arg TURBO_TOKEN=$TURBO_TOKEN --build-arg TURBO_TEAM=$TURBO_TEAM --progress=plain . 2>&1 | tee docker-build.log