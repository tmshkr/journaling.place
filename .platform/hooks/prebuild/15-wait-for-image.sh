#!/bin/bash -e

source .env
check_image_exists() {
  if out=$(aws ecr describe-images --repository-name="${GITHUB_REPOSITORY#*/}" --image-ids imageTag=$VERSION_LABEL 2>&1); then
    echo "true"
  else
    if [[ $out == *"ImageNotFoundException"* ]]; then
      echo "false"
    else
      echo $out
      return 1
    fi
  fi
}

# wait for the image to be ready
while out=$(check_image_exists); do
  if [[ $out == "true" ]]; then
    echo "Image with tag [$VERSION_LABEL] is ready. Proceeding..."
    exit 0
  fi
  echo "Image not ready yet. Retrying in 10 seconds..."
  sleep 10
done

echo "There was an error checking the image:"
echo $out
exit 1
