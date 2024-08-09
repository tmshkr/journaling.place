#!/bin/bash

set -eo pipefail

export LABEL_REF_NAME="${GITHUB_REF_NAME//\//_}"
export VERSION_LABEL="$LABEL_REF_NAME-$GITHUB_SHA"

echo "LABEL_REF_NAME=$LABEL_REF_NAME" >>$GITHUB_OUTPUT
echo "VERSION_LABEL=$VERSION_LABEL" >>$GITHUB_OUTPUT

scripts/handle-changed-files.sh
scripts/check-image-exists.sh $TAG

echo APP_VERSION=$APP_VERSION >>.env
echo GITHUB_REF_NAME=$GITHUB_REF_NAME >>.env
echo GITHUB_SHA=$GITHUB_SHA >>.env
echo TAG=$TAG >>.env
echo VERSION_LABEL=$VERSION_LABEL >>.env

source ./scripts/sub-option-settings.sh
zip -r bundle.zip . -x '*.git*'
