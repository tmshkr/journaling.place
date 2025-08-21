import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";

async function fetchCloudflareIpV6Cidrs() {
    const cidrs = await fetch(`https://www.cloudflare.com/ips-v6/`).then(
        async (response) => {
            const text = await response.text();
            return text.split("\n");
        }
    );
    return cidrs;
}

export class VpcStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, "Vpc", {
            ipProtocol: ec2.IpProtocol.DUAL_STACK,
            natGateways: 0,
            availabilityZones: [
                "us-west-2a",
                "us-west-2b",
                "us-west-2c",
                "us-west-2d",
            ],
            subnetConfiguration: [
                {
                    name: "PublicSubnet",
                    subnetType: ec2.SubnetType.PUBLIC,
                },
            ],
        });

        this.exportValue(vpc.vpcId, { name: "JpVpcId" });
        this.exportValue(
            vpc.publicSubnets.map(({ subnetId }) => subnetId).join(","),
            {
                name: "JpPublicSubnets",
            }
        );

        const sg = new ec2.SecurityGroup(this, "JpSecurityGroup", {
            securityGroupName: "JpSecurityGroup",
            allowAllOutbound: true,
            vpc,
        });

        sg.addIngressRule(ec2.PrefixList.fromPrefixListId(this, "Ec2InstanceConnectIngressRule",
            "pl-047d464325e7bf465"), ec2.Port.tcp(22), "Allow SSH traffic from EC2 Instance Connect");

        fetchCloudflareIpV6Cidrs().then((cidrs) => {
            cidrs.forEach((cidr) => {
                sg.addIngressRule(
                    ec2.Peer.ipv6(cidr),
                    ec2.Port.tcp(443),
                    "Allow traffic from Cloudflare"
                );
            });
        });


        new cdk.CfnOutput(this, "JpSecurityGroupId", {
            value: sg.securityGroupId,
            exportName: "JpSecurityGroupId",
        });
    }
}
