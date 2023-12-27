#!bin/bash -e

source .env

if [ -z "$STAGE" ]; then
  echo "STAGE is not set"
  exit 1
fi

cp docker-compose.$STAGE.yml docker-compose.yml
