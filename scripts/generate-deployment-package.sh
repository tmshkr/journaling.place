#!/bin/bash -e
source ./scripts/sub-option-settings.sh

echo APP_VERSION=$GITHUB_REF_NAME-$TAG >>.env
echo ENVIRONMENT=$ENVIRONMENT >>.env
echo SHA=$GITHUB_SHA >>.env
echo TAG=$TAG >>.env
zip -r bundle.zip . -x '*.git*'
