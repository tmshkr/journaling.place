import * as cdk from "aws-cdk-lib";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";

export class ALBStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cert = new acm.Certificate(this, "Certificate", {
      domainName: "journaling.place",
      certificateName: "journaling.place",
      subjectAlternativeNames: ["*.journaling.place"],
      validation: acm.CertificateValidation.fromDns(
        route53.HostedZone.fromLookup(this, "Zone", {
          domainName: "journaling.place",
        })
      ),
    });

    const alb = new elbv2.ApplicationLoadBalancer(this, "ALB", {
      deletionProtection: true,
      internetFacing: true,
      ipAddressType: elbv2.IpAddressType.IPV4,
      loadBalancerName: "jp-alb",
      vpc: ec2.Vpc.fromLookup(this, "DefaultVPC", { isDefault: true }),
    });

    alb.addListener("HttpListener", {
      port: 80,
      open: true,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: "text/plain",
        messageBody: "OK",
      }),
    });

    alb.addListener("HttpsListener", {
      port: 443,
      open: true,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: "text/plain",
        messageBody: "OK",
      }),
      certificates: [cert],
      protocol: elbv2.ApplicationProtocol.HTTPS,
      sslPolicy: elbv2.SslPolicy.RECOMMENDED,
    });

    new cdk.CfnOutput(this, "HttpsCertificateArn", {
      value: cert.certificateArn,
      exportName: "HttpsCertificateArn",
    });

    new cdk.CfnOutput(this, "SharedLoadBalancerArn", {
      value: alb.loadBalancerArn,
      exportName: "SharedLoadBalancerArn",
    });
  }
}
