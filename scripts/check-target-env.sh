#! /bin/bash -e

health=$(echo $TARGET_ENV_JSON | jq -r '.Health')

if [ "$health" != "Green" ]; then
  echo "Target environment is not healthy"
  exit 1
fi
