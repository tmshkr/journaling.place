#!/bin/bash
set -e

while true; do
  version=$(curl --silent --fail -k $1/api/info | jq -r '.version')
  if [[ $version == $2 ]]; then
    echo "$1 running version $version"
    break
  fi
  echo "Waiting for $1 to be ready"
  sleep 5
done