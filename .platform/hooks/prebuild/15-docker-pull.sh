#!/bin/bash

set -o xtrace
set -e

source .env

# Pull image from Docker Hub
while ! docker pull tmshkr/journaling.place:$DOCKER_TAG; do
    echo "Retrying Docker pull..."
    sleep 10
done
