#!/bin/bash -e

alb_stack=$(aws cloudformation describe-stacks --stack-name ALBStack)
export SHARED_LOAD_BALANCER_ARN=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="SharedLoadBalancerArn") | .OutputValue')

if [ -z "$SHARED_LOAD_BALANCER_ARN" ]; then
  echo "SHARED_LOAD_BALANCER_ARN is not set"
  exit 1
fi

echo$(envsubst <option-settings.staging.json) >option-settings.staging.json
