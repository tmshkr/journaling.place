#!/bin/bash -e

if output=$(aws ecr describe-images --repository-name=journaling.place --image-ids imageTag=$1 2>&1); then
  echo "true"
  if [ -z "$GITHUB_OUTPUT" ]; then
    echo IMAGE_EXISTS=true >>$GITHUB_OUTPUT
  fi
else
  if [[ $output == *"ImageNotFoundException"* ]]; then
    echo "false"
    if [ -z "$GITHUB_OUTPUT" ]; then
      echo IMAGE_EXISTS=false >>$GITHUB_OUTPUT
    fi
  else
    echo "Command failed with error: $output"
    exit 1
  fi
fi
