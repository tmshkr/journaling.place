import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class EC2Stack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    getIpRange(this.region, "EC2_INSTANCE_CONNECT").then((ip_prefix) => {
      const sshAccessList = new ec2.PrefixList(this, "SSHAccessList", {
        prefixListName: "SSHAccessList",
        maxEntries: 5,
        entries: [
          {
            cidr: ip_prefix,
            description: "EC2 Instance Connect",
          },
        ],
      });

      new cdk.CfnOutput(this, "SSHAccessListId", {
        value: sshAccessList.prefixListId,
        exportName: "SSHAccessListId",
      });
    });
  }
}

async function getIpRange(region: string, service: string) {
  if (!region || !service) {
    throw new Error("Missing required parameters");
  }
  const ranges = await fetch(
    `https://ip-ranges.amazonaws.com/ip-ranges.json`
  ).then((response) => response.json());
  const { ip_prefix } = ranges.prefixes.find(
    (prefix: any) => prefix.region === region && prefix.service === service
  );
  return ip_prefix;
}
