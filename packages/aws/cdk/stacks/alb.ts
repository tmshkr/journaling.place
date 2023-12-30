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

    const httpListener = alb.addListener("HttpListener", {
      port: 80,
      open: true,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: "text/plain",
        messageBody: alb.loadBalancerDnsName,
      }),
    });

    const httpsListener = alb.addListener("HttpsListener", {
      port: 443,
      open: true,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: "text/plain",
        messageBody: alb.loadBalancerDnsName,
      }),
      certificates: [cert],
      protocol: elbv2.ApplicationProtocol.HTTPS,
      sslPolicy: elbv2.SslPolicy.RECOMMENDED,
    });

    const prodHttpListenerRule = new elbv2.ApplicationListenerRule(
      this,
      "http://journaling.place",
      {
        listener: httpListener,
        priority: 1,
        conditions: [elbv2.ListenerCondition.hostHeaders(["journaling.place"])],
        action: elbv2.ListenerAction.fixedResponse(200, {
          contentType: "text/plain",
          messageBody: "journaling.place",
        }),
      }
    );

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

    const stagingHttpListenerRule = new elbv2.ApplicationListenerRule(
      this,
      "http://staging.journaling.place",
      {
        listener: httpListener,
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

    new cdk.CfnOutput(this, "HttpsCertificateArn", {
      value: cert.certificateArn,
      exportName: "HttpsCertificateArn",
    });

    new cdk.CfnOutput(this, "SharedLoadBalancerArn", {
      value: alb.loadBalancerArn,
      exportName: "SharedLoadBalancerArn",
    });

    new cdk.CfnOutput(this, "prod-http-listener-rule-arn", {
      value: prodHttpListenerRule.listenerRuleArn,
      exportName: "prod-http-listener-rule-arn",
    });

    new cdk.CfnOutput(this, "prod-https-listener-rule-arn", {
      value: prodHttpsListenerRule.listenerRuleArn,
      exportName: "prod-https-listener-rule-arn",
    });

    new cdk.CfnOutput(this, "staging-http-listener-rule-arn", {
      value: stagingHttpListenerRule.listenerRuleArn,
      exportName: "staging-http-listener-rule-arn",
    });

    new cdk.CfnOutput(this, "staging-https-listener-rule-arn", {
      value: stagingHttpsListenerRule.listenerRuleArn,
      exportName: "staging-https-listener-rule-arn",
    });
  }
}
