#!/bin/bash -e
source ./scripts/sub-option-settings.sh

if [ $PREP == "true" ]; then
  echo APP_VERSION=prep-$TAG >>.env
  echo ENVIRONMENT=$ENVIRONMENT >>.env
  echo GITHUB_REF_NAME=$GITHUB_REF_NAME >>.env
  echo SHA=$GITHUB_SHA >>.env
  echo TAG=$TAG >>.env
  mv -f docker-compose.prep.yml docker-compose.yml
  zip bundle.zip docker-compose.yml .ebextensions .env
  exit 0
fi

echo APP_VERSION=$GITHUB_REF_NAME-$TAG >>.env
echo ENVIRONMENT=$ENVIRONMENT >>.env
echo GITHUB_REF_NAME=$GITHUB_REF_NAME >>.env
echo SHA=$GITHUB_SHA >>.env
echo TAG=$TAG >>.env
zip -r bundle.zip . -x '*.git*'
