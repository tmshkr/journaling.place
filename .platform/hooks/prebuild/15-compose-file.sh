#!/bin/bash -e

source .env
# check if the image exists in ECR
if output=$(./scripts/check-image-exists.sh $GITHUB_SHA); then
  if [ "$output" == "true" ]; then
    cp docker-compose.run.yml docker-compose.yml
  else
    cp docker-compose.prep.yml docker-compose.yml
  fi
else
  echo "There was an error checking the image: $output"
  exit 1
fi
