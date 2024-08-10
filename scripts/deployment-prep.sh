#!/bin/bash

set -eo pipefail

export LABEL_REF_NAME="${GITHUB_REF_NAME//\//_}"
export VERSION_LABEL="$LABEL_REF_NAME.$GITHUB_SHA"

echo "LABEL_REF_NAME=$LABEL_REF_NAME" >>$GITHUB_OUTPUT
echo "VERSION_LABEL=$VERSION_LABEL" >>$GITHUB_OUTPUT

scripts/handle-changed-files.sh

IMAGE_EXISTS=$(scripts/check-image-exists.sh $TAG)
echo "IMAGE_EXISTS=$IMAGE_EXISTS"
echo "IMAGE_EXISTS=$IMAGE_EXISTS" >>$GITHUB_OUTPUT

echo APP_VERSION=$APP_VERSION >>.env
echo GITHUB_REF_NAME=$GITHUB_REF_NAME >>.env
echo GITHUB_SHA=$GITHUB_SHA >>.env
echo TAG=$TAG >>.env
echo VERSION_LABEL=$VERSION_LABEL >>.env

scripts/sub-option-settings.sh

echo "Creating bundle.zip"
zip -r bundle.zip . -x '*.git*'
