#! /bin/bash -e

VpcStack=$(aws cloudformation describe-stacks --stack-name VpcStack)
PublicSubnets=$(echo $VpcStack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="JpPublicSubnets") | .OutputValue')
VpcId=$(echo $VpcStack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="JpVpcId") | .OutputValue')

gh variable set BLUE_ENV --body "jp-blue"
gh variable set GREEN_ENV --body "jp-green"
gh variable set PUBLIC_SUBNET_IDS --body $PublicSubnets
gh variable set PRODUCTION_CNAME --body "jp-production"
gh variable set STAGING_CNAME --body "jp-staging"
gh variable set VPC_ID --body $VpcId

echo "Updated GitHub Actions environment variables"
