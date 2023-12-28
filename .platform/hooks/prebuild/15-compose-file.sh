#!/bin/bash -e

source .env
images=$(aws ecr list-images --repository-name journaling.place)

if echo $images | grep -q $TAG; then
  echo "Image $TAG is ready"
  cp docker-compose.run.yml docker-compose.yml
else
  echo "Image $TAG is not ready"
  cp docker-compose.prep.yml docker-compose.yml
fi
