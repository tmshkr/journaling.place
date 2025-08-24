#! /bin/bash -e

source .env

key=${VAR_KEY:-$(openssl rand -hex 3)}

VpcStack=$(aws cloudformation describe-stacks --stack-name VpcStack)
PublicSubnets=$(echo $VpcStack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="JpPublicSubnets") | .OutputValue')
VpcId=$(echo $VpcStack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="JpVpcId") | .OutputValue')
JpSecurityGroupId=$(echo $VpcStack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="JpSecurityGroupId") | .OutputValue')

gh variable set BLUE_ENV --body "jp-blue-$key"
gh variable set GREEN_ENV --body "jp-green-$key"
gh variable set PUBLIC_SUBNET_IDS --body $PublicSubnets
gh variable set PRODUCTION_CNAME --body "jp-production-$key"
gh variable set SECURITY_GROUP_IDS --body $JpSecurityGroupId
gh variable set STAGING_CNAME --body "jp-staging-$key"
gh variable set VPC_ID --body $VpcId

echo "Updated GitHub Actions environment variables"
