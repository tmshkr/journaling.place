import * as cdk from "aws-cdk-lib";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";

export class ALBStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const zone = route53.HostedZone.fromLookup(this, "Zone", {
      domainName: "journaling.place",
    });
    const cert = new acm.Certificate(this, "Certificate", {
      domainName: "journaling.place",
      certificateName: "journaling.place",
      subjectAlternativeNames: ["*.journaling.place"],
      validation: acm.CertificateValidation.fromDns(zone),
    });

    const alb = new elbv2.ApplicationLoadBalancer(this, "ALB", {
      deletionProtection: true,
      internetFacing: true,
      ipAddressType: elbv2.IpAddressType.IPV4,
      loadBalancerName: "jp-alb",
      vpc: ec2.Vpc.fromLookup(this, "DefaultVPC", { isDefault: true }),
    });

    new route53.ARecord(this, "StagingAliasRecord", {
      zone,
      recordName: "staging.journaling.place",
      target: route53.RecordTarget.fromAlias(
        new route53Targets.LoadBalancerTarget(alb)
      ),
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

    new cdk.CfnOutput(this, "ProdHttpListenerRuleArn", {
      value: prodHttpListenerRule.listenerRuleArn,
      exportName: "prod_http_listener_rule_arn",
    });

    new cdk.CfnOutput(this, "ProdHttpsListenerRuleArn", {
      value: prodHttpsListenerRule.listenerRuleArn,
      exportName: "prod_https_listener_rule_arn",
    });

    new cdk.CfnOutput(this, "StagingHttpListenerRuleArn", {
      value: stagingHttpListenerRule.listenerRuleArn,
      exportName: "staging_http_listener_rule_arn",
    });

    new cdk.CfnOutput(this, "StagingHttpsListenerRuleArn", {
      value: stagingHttpsListenerRule.listenerRuleArn,
      exportName: "staging_https_listener_rule_arn",
    });
  }
}
