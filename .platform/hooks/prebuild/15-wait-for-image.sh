#!/bin/bash -e

source .env
# wait for the image to be ready
while output=$(./scripts/check-image-exists.sh $TAG); do
  if [ "$output" == "true" ]; then
    echo "Image with tag $TAG is ready. Proceeding..."
    cp docker-compose.run.yml docker-compose.yml
    exit 0
  fi
  echo "Image not ready yet. Retrying in 10 seconds..."
  sleep 10
done

echo "There was an error checking the image."
echo $output
exit 1
