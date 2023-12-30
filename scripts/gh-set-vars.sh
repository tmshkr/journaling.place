key=$(openssl rand -hex 3)

gh variable set BLUE_ENV --body "jp-blue-$key"
gh variable set GREEN_ENV --body "jp-green-$key"
gh variable set PRODUCTION_CNAME --body "jp-main-$key"
gh variable set STAGING_CNAME --body "jp-staging-$key"

alb_stack=$(aws cloudformation describe-stacks --stack-name ALBStack)
ProdHttpListenerRuleArn=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="ProdHttpListenerRuleArn") | .OutputValue')
ProdHttpsListenerRuleArn=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="ProdHttpsListenerRuleArn") | .OutputValue')
StagingHttpListenerRuleArn=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="StagingHttpListenerRuleArn") | .OutputValue')
StagingHttpsListenerRuleArn=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="StagingHttpsListenerRuleArn") | .OutputValue')

aws elbv2 add-tags --resource-arns $ProdHttpListenerRuleArn --tags Key=elasticbeanstalk:cname,Value=jp-main-$key
aws elbv2 add-tags --resource-arns $ProdHttpsListenerRuleArn --tags Key=elasticbeanstalk:cname,Value=jp-main-$key
aws elbv2 add-tags --resource-arns $StagingHttpListenerRuleArn --tags Key=elasticbeanstalk:cname,Value=jp-staging-$key
aws elbv2 add-tags --resource-arns $StagingHttpsListenerRuleArn --tags Key=elasticbeanstalk:cname,Value=jp-staging-$key

echo "Updated listener rule tags"
