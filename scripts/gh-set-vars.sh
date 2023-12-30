key=$(openssl rand -hex 3)

gh variable set BLUE_ENV --body "jp-blue-$key"
gh variable set GREEN_ENV --body "jp-green-$key"
gh variable set PRODUCTION_CNAME --body "jp-main-$key"
gh variable set STAGING_CNAME --body "jp-staging-$key"

alb_stack=$(aws cloudformation describe-stacks --stack-name ALBStack)
prod_http_listener_rule_arn=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="prod-http-listener-rule-arn") | .OutputValue')
prod_https_listener_rule_arn=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="prod-https-listener-rule-arn") | .OutputValue')
staging_http_listener_rule_arn=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="staging-http-listener-rule-arn") | .OutputValue')
staging_https_listener_rule_arn=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="staging-https-listener-rule-arn") | .OutputValue')

aws elbv2 add-tags --resource-arns $prod_http_listener_rule_arn --tags Key=elasticbeanstalk:cname,Value=jp-main-$key
aws elbv2 add-tags --resource-arns $prod_https_listener_rule_arn --tags Key=elasticbeanstalk:cname,Value=jp-main-$key
aws elbv2 add-tags --resource-arns $staging_http_listener_rule_arn --tags Key=elasticbeanstalk:cname,Value=jp-staging-$key
aws elbv2 add-tags --resource-arns $staging_https_listener_rule_arn --tags Key=elasticbeanstalk:cname,Value=jp-staging-$key

echo "Updated listener rule tags"
