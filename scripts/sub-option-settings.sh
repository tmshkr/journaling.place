#!/bin/bash -e

alb_stack=$(aws cloudformation describe-stacks --stack-name AlbStack)

export SHARED_LOAD_BALANCER_ARN=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="SharedLoadBalancerArn") | .OutputValue')
export HTTPS_CERTIFICATE_ARN=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="HttpsCertificateArn") | .OutputValue')

echo $(envsubst <option-settings.json) >option-settings.json
