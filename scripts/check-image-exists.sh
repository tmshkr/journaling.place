#!/bin/bash -e


if output=$(aws ecr describe-images --repository-name=journaling.place --image-ids imageTag=$1 2>&1); then
  echo "true"
else
    if [[ $output == *"ImageNotFoundException"* ]]; then
        echo "false"
    else
        echo "Command failed with error: $output"
        exit 1
    fi
fi