#!/bin/bash -e

export SSL_CERTIFICATE_ARN=$(aws acm list-certificates --query "CertificateSummaryList[?DomainName=='$DOMAIN_NAME'].CertificateArn" --output text)

export DEFAULT_VPC_ID=$(aws ec2 describe-vpcs --query 'Vpcs[?IsDefault==`true`].VpcId' --output text)
export DEFAULT_SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --filters Name=vpc-id,Values=$DEFAULT_VPC_ID --query 'SecurityGroups[?GroupName==`default`].GroupId' --output text)

echo $(envsubst <option-settings.json) >option-settings.json
