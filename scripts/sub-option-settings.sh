#!/bin/bash -e

alb_stack=$(aws cloudformation describe-stacks --stack-name ALBStack)
export SHARED_LOAD_BALANCER_ARN=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="SharedLoadBalancerArn") | .OutputValue')

if [ -z "$PREP" ]; then
  export PREP="false"
fi

if [ -z "$DOMAIN_NAME" ]; then
  echo "DOMAIN_NAME is not set"
  failed=true
fi

if [ -z "$SHARED_LOAD_BALANCER_ARN" ]; then
  echo "SHARED_LOAD_BALANCER_ARN is not set"
  failed=true
fi

if [ "$failed" == true ]; then
  exit 1
fi

echo $(envsubst <option-settings.json) >option-settings.json
