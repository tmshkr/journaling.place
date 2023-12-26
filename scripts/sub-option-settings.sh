#!/bin/bash -e

export SSL_CERTIFICATE_ARN=$(aws acm list-certificates --query "CertificateSummaryList[?DomainName=='$DOMAIN_NAME'].CertificateArn" --output text)
export SSH_ACCESS_LIST=$(aws cloudformation describe-stacks --stack-name EC2Stack | jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="SSHAccessListId") | .OutputValue')

echo $(envsubst <option-settings.json) >option-settings.json
