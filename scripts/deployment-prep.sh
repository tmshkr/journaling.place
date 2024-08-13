#!/bin/bash

set -eo pipefail

export VERSION_LABEL="${GITHUB_REF_NAME//\//_}.$GITHUB_SHA"
echo "VERSION_LABEL=$VERSION_LABEL" >>$GITHUB_OUTPUT

scripts/turbo-sha.mjs
source $GITHUB_ENV
export TURBO_TAG

alb_stack=$(aws cloudformation describe-stacks --stack-name ALBStack)
export SHARED_LOAD_BALANCER_ARN=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="SharedLoadBalancerArn") | .OutputValue')

echo $(envsubst <deploy-vars.json) >deploy-vars.json
echo $(envsubst <option-settings.json) >option-settings.json

if jq '.[] | test("^$")' deploy-vars.json | grep true; then
    echo "Empty value detected in deploy-vars.json"
    jq 'to_entries | map(select(.value == ""))' deploy-vars.json
    exit 1
fi

if jq '.[].Value | tostring | test("^$")' option-settings.json | grep true; then
    echo "Empty value detected in option-settings.json"
    jq '.[] | select(.Value == "")' option-settings.json
    exit 1
fi

echo "Creating bundle.zip"
zip -r bundle.zip . -x '*.git*'
