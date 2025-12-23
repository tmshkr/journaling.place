#!/bin/bash -e

source .env

required_vars=(
  MONGO_INITDB_ROOT_USERNAME
  MONGO_INITDB_ROOT_PASSWORD
  MONGO_KEYFILE
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "Error: Environment variable '$var' is not set."
    exit 1
  fi
  export $var
done


envsubst < k8s/mongo.yaml | kubectl apply -f -

# envsubst < app.yaml | kubectl apply -f -
