#!/bin/bash

set -eo pipefail

export LABEL_REF_NAME="${GITHUB_REF_NAME//\//_}"
export VERSION_LABEL="$LABEL_REF_NAME-$GITHUB_SHA"

echo "LABEL_REF_NAME=$LABEL_REF_NAME" >>$GITHUB_OUTPUT
echo "VERSION_LABEL=$VERSION_LABEL" >>$GITHUB_OUTPUT

scripts/handle-changed-files.sh
scripts/check-image-exists.sh $TAG
scripts/generate-deployment-package.sh
