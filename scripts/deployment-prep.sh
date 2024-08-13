#!/bin/bash

set -eo pipefail

detect_empty_values() {
    if jq '.[] | test("^$")' $1 | grep true; then
        echo "Empty value detected in $1"
        jq 'to_entries | map(select(.value == ""))' $1
        exit 1
    fi
}

export VERSION_LABEL="${GITHUB_REF_NAME//\//_}.$GITHUB_SHA"
echo "VERSION_LABEL=$VERSION_LABEL" >>$GITHUB_OUTPUT

scripts/turbo-sha.mjs
cat $GITHUB_ENV
source $GITHUB_ENV
export $TURBO_TAG

alb_stack=$(aws cloudformation describe-stacks --stack-name ALBStack)
export SHARED_LOAD_BALANCER_ARN=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="SharedLoadBalancerArn") | .OutputValue')

echo $(envsubst <deploy-vars.json) >deploy-vars.json
echo $(envsubst <option-settings.json) >option-settings.json

detect_empty_values deploy-vars.json
detect_empty_values option-settings.json

echo "Creating bundle.zip"
zip -r bundle.zip . -x '*.git*'
