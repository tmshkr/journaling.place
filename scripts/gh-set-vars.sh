#! /bin/bash -e

key=$(openssl rand -hex 3)

alb_stack=$(aws cloudformation describe-stacks --stack-name ALBStack)
PublicSubnets=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="PublicSubnets") | .OutputValue')
ProdHttpsListenerRuleArn=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="ProdHttpsListenerRuleArn") | .OutputValue')
SharedLoadBalancerArn=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="SharedLoadBalancerArn") | .OutputValue')
StagingHttpsListenerRuleArn=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="StagingHttpsListenerRuleArn") | .OutputValue')
VpcId=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="VpcId") | .OutputValue')

gh variable set BLUE_ENV --body "jp-blue-$key"
gh variable set GREEN_ENV --body "jp-green-$key"
gh variable set PUBLIC_SUBNET_IDS --body $PublicSubnets
gh variable set PRODUCTION_CNAME --body "jp-production-$key"
gh variable set STAGING_CNAME --body "jp-staging-$key"
gh variable set SHARED_LOAD_BALANCER_ARN --body $SharedLoadBalancerArn
gh variable set VPC_ID --body $VpcId

echo "Updated GitHub Actions environment variables"

aws elbv2 add-tags --resource-arns $ProdHttpsListenerRuleArn --tags Key=bluegreenbeanstalk:target_cname,Value=jp-main-$key
aws elbv2 add-tags --resource-arns $StagingHttpsListenerRuleArn --tags Key=bluegreenbeanstalk:target_cname,Value=jp-staging-$key

echo "Updated listener rule tags"
