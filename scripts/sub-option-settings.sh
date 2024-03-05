#!/bin/bash -e

if [ -z "$PREP" ]; then
  export PREP="false"
fi

if [ -z "$DOMAIN_NAME" ]; then
  echo "DOMAIN_NAME is not set"
  failed=true
fi

if [ -z "$SECURITY_GROUP_ID" ]; then
  echo "SECURITY_GROUP_ID is not set"
  failed=true
fi

if [ "$failed" == true ]; then
  exit 1
fi

echo $(envsubst <option-settings.json) >option-settings.json
echo $(envsubst <./.ebextensions/00_efs_ingress.config ) >./.ebextensions/00_efs_ingress.config 