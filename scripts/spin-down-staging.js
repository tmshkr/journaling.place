const { execSync } = require("child_process");

function spinDownStaging() {
  const stagingEnv = JSON.parse(
    execSync(
      `aws elasticbeanstalk describe-environments --application-name journaling.place`
    )
  ).Environments.find(
    ({ CNAME, Status }) => CNAME.startsWith("jp-staging") && Status === "Ready"
  );

  const stagingASG = JSON.parse(
    execSync(`aws autoscaling describe-auto-scaling-groups`)
  ).AutoScalingGroups.find(({ AutoScalingGroupName }) =>
    AutoScalingGroupName.startsWith(`awseb-${stagingEnv.EnvironmentId}`)
  );

  const eip = JSON.parse(execSync(`aws ec2 describe-addresses`)).Addresses.find(
    ({ PublicIp }) => PublicIp === stagingEnv.EndpointURL
  );

  execSync(`
    aws ec2 disassociate-address --association-id ${eip.AssociationId}
    aws ec2 release-address --allocation-id ${eip.AllocationId}
    aws autoscaling update-auto-scaling-group --auto-scaling-group-name ${stagingASG.AutoScalingGroupName} --min-size 0 --max-size 0 --desired-capacity 0
    `);
}

spinDownStaging();
