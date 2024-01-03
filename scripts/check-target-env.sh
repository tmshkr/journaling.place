#! /bin/bash -e

health=$(echo $TARGET_ENV_JSON | jq -r '.Health')
cname=$(echo $TARGET_ENV_JSON | jq -r '.CNAME')
version=$(echo $TARGET_ENV_JSON | jq -r '.VersionLabel')

echo "Target environment health: $health"
echo "Target environment version: $version"
echo "Target environment CNAME: http://$cname"

if [ "$health" != "Green" ]; then
  echo "Target environment is not healthy"
  exit 1
fi
