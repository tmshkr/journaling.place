#!/usr/bin/env node
const { execSync } = require("child_process");

main();
function main() {
  const stagingEnv = JSON.parse(
    execSync(
      `aws elasticbeanstalk describe-environments --application-name journaling.place --no-include-deleted`
    )
  ).Environments.find(({ CNAME }) => CNAME.startsWith("jp-staging"));

  if (!stagingEnv) {
    console.log("Staging environment not found");
    return;
  }

  if (stagingEnv.Status !== "Ready") {
    console.log("Staging environment is not ready");
    return;
  }

  const { EnvironmentResources } = JSON.parse(
    execSync(
      `aws elasticbeanstalk describe-environment-resources --environment-id ${stagingEnv.EnvironmentId}`
    )
  );

  console.log(`Spinning down ${stagingEnv.EnvironmentName}`);
  if (EnvironmentResources.LoadBalancers.length > 0) {
    spinDownLoadBalancer(EnvironmentResources);
  } else {
    spinDownSingleInstance(stagingEnv, EnvironmentResources);
  }
  console.log("Done");
}

function spinDownLoadBalancer(EnvironmentResources) {
  const asgName = EnvironmentResources.AutoScalingGroups[0].Name;
  execSync(`
    aws autoscaling update-auto-scaling-group --auto-scaling-group-name ${asgName} --min-size 0 --max-size 0 --desired-capacity 0
    `);

  // delete dedicated load balancer
  const elbArn = EnvironmentResources.LoadBalancers[0].Name;
  if (elbArn.split("/")[2].startsWith("awseb--AWSEB")) {
    execSync(`aws elbv2 delete-load-balancer --load-balancer-arn ${elbArn}`);
  }
}

function spinDownSingleInstance(stagingEnv, EnvironmentResources) {
  const asgName = EnvironmentResources.AutoScalingGroups[0].Name;
  const eip = JSON.parse(execSync(`aws ec2 describe-addresses`)).Addresses.find(
    ({ PublicIp }) => PublicIp === stagingEnv.EndpointURL
  );

  execSync(`
    aws ec2 disassociate-address --association-id ${eip.AssociationId}
    aws ec2 release-address --allocation-id ${eip.AllocationId}
    aws autoscaling update-auto-scaling-group --auto-scaling-group-name ${asgName} --min-size 0 --max-size 0 --desired-capacity 0
    `);
}
