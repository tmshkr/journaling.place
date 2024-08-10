#!/bin/bash

set -eo pipefail

export LABEL_REF_NAME="${GITHUB_REF_NAME//\//_}"
export VERSION_LABEL="$LABEL_REF_NAME.$GITHUB_SHA"

echo "LABEL_REF_NAME=$LABEL_REF_NAME" >>$GITHUB_OUTPUT
echo "VERSION_LABEL=$VERSION_LABEL" >>$GITHUB_OUTPUT

scripts/handle-turbo-sha.mjs

alb_stack=$(aws cloudformation describe-stacks --stack-name ALBStack)
export SHARED_LOAD_BALANCER_ARN=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="SharedLoadBalancerArn") | .OutputValue')
if [ -z "$SHARED_LOAD_BALANCER_ARN" ]; then
    echo "SHARED_LOAD_BALANCER_ARN is not available"
    exit 1
fi

echo $(envsubst <deploy-meta.json) >deploy-meta.json
echo $(envsubst <option-settings.json) >option-settings.json

echo "Creating bundle.zip"
zip -r bundle.zip . -x '*.git*'
