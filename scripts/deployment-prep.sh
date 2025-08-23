#!/bin/bash

set -eo pipefail

export VERSION_LABEL="${GITHUB_REF_NAME//\//_}.$GITHUB_SHA"
echo "VERSION_LABEL=$VERSION_LABEL" >>$GITHUB_OUTPUT
export DOCKER_TAG="${GITHUB_REF_NAME//\//_}.$GITHUB_SHA"

echo $(envsubst <option-settings.json) >option-settings.json

if $(jq 'any(.Value == "")' option-settings.json); then
    echo "Empty value detected in option-settings.json"
    jq '.[] | select(.Value == "")' option-settings.json
    exit 1
fi

echo "Creating bundle.zip"
zip -r bundle.zip . -x '*.git*'
