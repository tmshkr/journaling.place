import {
  DescribeAutoScalingGroupsCommand,
  AutoScalingClient,
} from "@aws-sdk/client-auto-scaling";
import {
  DescribeEnvironmentsCommand,
  DescribeEnvironmentResourcesCommand,
  ElasticBeanstalkClient,
} from "@aws-sdk/client-elastic-beanstalk";
import {
  Action,
  DescribeListenersCommand,
  DescribeRulesCommand,
  DescribeTagsCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
  ModifyRuleCommand,
  Rule,
} from "@aws-sdk/client-elastic-load-balancing-v2";

const ebClient = new ElasticBeanstalkClient();
const asClient = new AutoScalingClient();
const elbv2Client = new ElasticLoadBalancingV2Client();

export async function updateListenerRules() {
  const { EB_ENVIRONMENT_NAME, AWS_REGION } = process.env;
  if (!EB_ENVIRONMENT_NAME || !AWS_REGION) {
    throw new Error(
      "Environment variables EB_ENVIRONMENT_NAME and AWS_REGION must be set"
    );
  }
  const { Environments } = await ebClient.send(
    new DescribeEnvironmentsCommand({
      ApplicationName: "journaling.place",
      EnvironmentNames: [EB_ENVIRONMENT_NAME],
      IncludeDeleted: false,
    })
  );
  if (!Environments || Environments.length === 0) {
    throw new Error(`No environment found with name ${EB_ENVIRONMENT_NAME}`);
  }
  const [env] = Environments;
  const envCname = env.CNAME!.split(`.${AWS_REGION}.elasticbeanstalk.com`)[0];
  const { EnvironmentResources } = await ebClient.send(
    new DescribeEnvironmentResourcesCommand({
      EnvironmentId: env.EnvironmentId!,
    })
  );
  if (
    !EnvironmentResources ||
    !EnvironmentResources.LoadBalancers ||
    !EnvironmentResources.AutoScalingGroups ||
    EnvironmentResources.AutoScalingGroups.length === 0 ||
    EnvironmentResources.LoadBalancers.length === 0
  ) {
    throw new Error(
      `Environment ${EB_ENVIRONMENT_NAME} must have a load balancer and auto scaling group`
    );
  }
  const [alb] = EnvironmentResources.LoadBalancers;
  const { AutoScalingGroups } = await asClient.send(
    new DescribeAutoScalingGroupsCommand({
      AutoScalingGroupNames: EnvironmentResources.AutoScalingGroups.map(
        ({ Name }) => Name!
      ),
    })
  );

  const targetGroupArns = new Set<string>();
  for (const { TargetGroupARNs } of AutoScalingGroups!) {
    for (const arn of TargetGroupARNs!) {
      targetGroupArns.add(arn);
    }
  }

  const { TargetGroups } = await elbv2Client.send(
    new DescribeTargetGroupsCommand({
      TargetGroupArns: Array.from(targetGroupArns),
    })
  );

  const targetGroupArnsByPort = new Map<number, string>();
  for (const { Port, TargetGroupArn } of TargetGroups!) {
    targetGroupArnsByPort.set(Port!, TargetGroupArn!);
  }

  const { Listeners } = await elbv2Client.send(
    new DescribeListenersCommand({
      LoadBalancerArn: alb.Name!,
    })
  );

  const rules = new Map<string, Rule>();
  for (const { ListenerArn } of Listeners!) {
    await elbv2Client
      .send(new DescribeRulesCommand({ ListenerArn }))
      .then(({ Rules }) => {
        for (const rule of Rules!) {
          rules.set(rule.RuleArn!, rule);
        }
      });
  }

  const { TagDescriptions } = await elbv2Client.send(
    new DescribeTagsCommand({
      ResourceArns: Array.from(rules.keys()),
    })
  );

  for (const { Tags, ResourceArn } of TagDescriptions!) {
    if (!Tags) continue;
    const rule = rules.get(ResourceArn!);
    if (!rule) throw new Error(`Rule not found for arn: ${ResourceArn}`);
    const actions = rule.Actions;
    if (!actions || actions.length === 0)
      throw new Error(`No actions for rule: ${ResourceArn}`);

    const ruleCname = Tags.find(
      ({ Key }) => Key === "bluegreenbeanstalk:target_cname"
    )?.Value;
    const rulePort = Number(
      Tags!.find(({ Key }) => Key === "bluegreenbeanstalk:target_port")
        ?.Value || 80
    );
    if (ruleCname !== envCname) {
      continue;
    }

    const targetGroupArn = targetGroupArnsByPort.get(rulePort);
    if (!targetGroupArn) {
      throw new Error(`No target group found for rule: ${rule.RuleArn}`);
    }

    const handleActions = (actions: Action[], targetGroupArn: string) => {
      actions[actions.length - 1] = {
        Type: "forward",
        ForwardConfig: {
          TargetGroups: [
            {
              TargetGroupArn: targetGroupArn,
              Weight: 1,
            },
          ],
          TargetGroupStickinessConfig: { Enabled: false },
        },
      };
      return actions;
    };

    await elbv2Client.send(
      new ModifyRuleCommand({
        RuleArn: ResourceArn,
        Actions: handleActions(actions, targetGroupArn),
      })
    );

    console.log(`Updated rule:`);
    console.log(
      `https://${AWS_REGION}.console.aws.amazon.com/ec2/home?region=${AWS_REGION}#ListenerRuleDetails:ruleArn=${rule.RuleArn}`
    );
  }
}

updateListenerRules();
