import * as cdk from "aws-cdk-lib";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as acm from "aws-cdk-lib/aws-certificatemanager";

async function fetchCloudflareIpV6Cidrs() {
  const cidrs = await fetch(`https://www.cloudflare.com/ips-v6/`).then(
    async (response) => {
      const text = await response.text();
      return text.split("\n");
    }
  );
  return cidrs;
}

export class ALBStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cert = acm.Certificate.fromCertificateArn(
      this,
      "AlbCert",
      process.env.ALB_CERT_ARN as string
    );

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

    this.exportValue(vpc.vpcId, { name: "VpcId" });
    this.exportValue(
      vpc.publicSubnets.map(({ subnetId }) => subnetId).join(","),
      {
        name: "PublicSubnets",
      }
    );

    const sg = new ec2.SecurityGroup(this, "ALBSecurityGroup", {
      securityGroupName: "jp-alb-sg",
      allowAllOutbound: false,
      vpc: vpc,
    });

    fetchCloudflareIpV6Cidrs().then((cidrs) => {
      cidrs.forEach((cidr) => {
        sg.addIngressRule(
          ec2.Peer.ipv6(cidr),
          ec2.Port.tcp(443),
          "Allow traffic from Cloudflare"
        );
      });
    });

    const alb = new elbv2.ApplicationLoadBalancer(this, "ALB", {
      deletionProtection: true,
      internetFacing: true,
      ipAddressType: "dualstack-without-public-ipv4" as elbv2.IpAddressType,
      loadBalancerName: "jp-alb",
      securityGroup: sg,
      vpc: vpc,
    });

    const httpsListener = alb.addListener("HttpsListener", {
      port: 443,
      open: false,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: "text/plain",
        messageBody: alb.loadBalancerDnsName,
      }),
      certificates: [cert],
      protocol: elbv2.ApplicationProtocol.HTTPS,
      sslPolicy: elbv2.SslPolicy.RECOMMENDED,
    });

    const prodHttpsListenerRule = new elbv2.ApplicationListenerRule(
      this,
      "https://journaling.place",
      {
        listener: httpsListener,
        priority: 1,
        conditions: [elbv2.ListenerCondition.hostHeaders(["journaling.place"])],
        action: elbv2.ListenerAction.fixedResponse(200, {
          contentType: "text/plain",
          messageBody: "journaling.place",
        }),
      }
    );

    const stagingHttpsListenerRule = new elbv2.ApplicationListenerRule(
      this,
      "https://staging.journaling.place",
      {
        listener: httpsListener,
        priority: 2,
        conditions: [
          elbv2.ListenerCondition.hostHeaders(["staging.journaling.place"]),
        ],
        action: elbv2.ListenerAction.fixedResponse(200, {
          contentType: "text/plain",
          messageBody: "staging.journaling.place",
        }),
      }
    );

    new cdk.CfnOutput(this, "ALBSecurityGroupId", {
      value: sg.securityGroupId,
      exportName: "ALBSecurityGroupId",
    });

    new cdk.CfnOutput(this, "HttpsCertificateArn", {
      value: cert.certificateArn,
      exportName: "HttpsCertificateArn",
    });

    new cdk.CfnOutput(this, "ProdHttpsListenerRuleArn", {
      value: prodHttpsListenerRule.listenerRuleArn,
      exportName: "ProdHttpsListenerRuleArn",
    });

    new cdk.CfnOutput(this, "SharedLoadBalancerArn", {
      value: alb.loadBalancerArn,
      exportName: "SharedLoadBalancerArn",
    });

    new cdk.CfnOutput(this, "StagingHttpsListenerRuleArn", {
      value: stagingHttpsListenerRule.listenerRuleArn,
      exportName: "StagingHttpsListenerRuleArn",
    });
  }
}
