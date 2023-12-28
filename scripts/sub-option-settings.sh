#!/bin/bash -e

if [ -z "$DOMAIN_NAME" ]; then
  echo "DOMAIN_NAME is not set"
  failed=true
fi

if [ -z "$STAGE" ]; then
  echo "STAGE is not set"
  failed=true
fi

alb_stack=$(aws cloudformation describe-stacks --stack-name AlbStack)

export SHARED_LOAD_BALANCER_ARN=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="SharedLoadBalancerArn") | .OutputValue')
export HTTPS_CERTIFICATE_ARN=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="HttpsCertificateArn") | .OutputValue')

if [ -z "$SHARED_LOAD_BALANCER_ARN" ]; then
  echo "SHARED_LOAD_BALANCER_ARN is not set"
  failed=true
fi

if [ -z "$HTTPS_CERTIFICATE_ARN" ]; then
  echo "HTTPS_CERTIFICATE_ARN is not set"
  failed=true
fi

if [ "$failed" == true ]; then
  exit 1
fi

echo $(envsubst <option-settings.json) >option-settings.json
