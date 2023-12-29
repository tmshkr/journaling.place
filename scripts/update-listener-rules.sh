#!/bin/bash -e

alb_stack=$(aws cloudformation describe-stacks --stack-name ALBStack)
SHARED_LOAD_BALANCER_ARN=$(echo $alb_stack | jq -r '.Stacks[0].Outputs[] | select(.ExportName=="SharedLoadBalancerArn") | .OutputValue')

listeners=$(aws elbv2 describe-listeners --load-balancer-arn $SHARED_LOAD_BALANCER_ARN)

update_listener() {
  echo "Updating listener for port $1"

  listener_arn=$(echo $listeners | jq -r '.Listeners[] | select(.Port=='$1') | .ListenerArn')
  rules=$(aws elbv2 describe-rules --listener-arn $listener_arn)

  prod_domain_rule_arn=$(echo $rules | jq -r '.Rules[] | select(.Priority=="1") | .RuleArn')
  staging_domain_rule_arn=$(echo $rules | jq -r '.Rules[] | select(.Priority=="2") | .RuleArn')
  prod_tg_arn=$(echo $rules | jq -r '.Rules[] | select(.Conditions[].Field=="host-header" and .Conditions[].Values[0]=="'$PRODUCTION_CNAME.$AWS_REGION.elasticbeanstalk.com'") | .Actions[0].TargetGroupArn')
  staging_tg_arn=$(echo $rules | jq -r '.Rules[] | select(.Conditions[].Field=="host-header" and .Conditions[].Values[0]=="'$STAGING_CNAME.$AWS_REGION.elasticbeanstalk.com'") | .Actions[0].TargetGroupArn')

  aws elbv2 modify-rule --rule-arn $prod_domain_rule_arn --actions Type=forward,TargetGroupArn=$prod_tg_arn | jq
  aws elbv2 modify-rule --rule-arn $staging_domain_rule_arn --actions Type=forward,TargetGroupArn=$staging_tg_arn | jq

  echo "Updated listener for port $1"
}

update_listener 80
update_listener 443
