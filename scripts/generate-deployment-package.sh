#!/bin/bash -e

echo APP_VERSION=$APP_VERSION >>.env
echo GITHUB_REF_NAME=$GITHUB_REF_NAME >>.env
echo GITHUB_SHA=$GITHUB_SHA >>.env
echo TAG=$TAG >>.env
echo VERSION_LABEL=$VERSION_LABEL >>.env

source ./scripts/sub-option-settings.sh
zip -r bundle.zip . -x '*.git*'
