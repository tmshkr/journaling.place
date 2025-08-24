import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";

async function fetchCloudflareIpV4Cidrs() {
    const cidrs = await fetch(`https://www.cloudflare.com/ips-v4/`).then(
        async (response) => {
            const text = await response.text();
            return text.split("\n");
        }
    );
    return cidrs;
}

export class VpcStack extends cdk.Stack {
    securityGroup: ec2.SecurityGroup;
    vpc: ec2.IVpc;

    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.vpc = new ec2.Vpc(this, "Vpc", {
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
                    cidrMask: 26,
                    subnetType: ec2.SubnetType.PUBLIC,
                },
                {
                    name: "PrivateSubnet",
                    cidrMask: 26,
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                },
            ],
        });

        this.exportValue(this.vpc.vpcId, { name: "JpVpcId" });
        this.exportValue(
            this.vpc.publicSubnets.map(({ subnetId }) => subnetId).join(","),
            {
                name: "JpPublicSubnets",
            }
        );

        this.securityGroup = new ec2.SecurityGroup(this, "JpSecurityGroup", {
            securityGroupName: "JpSecurityGroup",
            allowAllOutbound: true,
            allowAllIpv6Outbound: true,
            vpc: this.vpc,
        });

        this.securityGroup.addIngressRule(this.securityGroup,
            ec2.Port.allTraffic(),
            "Allow all traffic within the security group");

        this.securityGroup.addIngressRule(ec2.PrefixList.fromPrefixListId(this,
            "Ec2InstanceConnectIngressRule",
            "pl-047d464325e7bf465"),
            ec2.Port.tcp(22),
            "Allow SSH traffic from EC2 Instance Connect");

        fetchCloudflareIpV4Cidrs().then((cidrs) => {
            cidrs.forEach((cidr) => {
                this.securityGroup.addIngressRule(
                    ec2.Peer.ipv4(cidr),
                    ec2.Port.tcp(443),
                    "Allow traffic from Cloudflare"
                );
                this.securityGroup.addIngressRule(
                    ec2.Peer.ipv4(cidr),
                    ec2.Port.tcp(80),
                    "Allow traffic from Cloudflare"
                );
            });
        });


        new cdk.CfnOutput(this, "JpSecurityGroupId", {
            value: this.securityGroup.securityGroupId,
            exportName: "JpSecurityGroupId",
        });
    }
}
