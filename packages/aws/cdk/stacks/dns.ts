import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53targets from "aws-cdk-lib/aws-route53-targets";

export class DnsStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const zone = new route53.HostedZone(this, "journaling.place", {
      zoneName: "journaling.place",
    });

    new route53.ARecord(this, "JournalingPlaceAlias", {
      zone,
      recordName: "journaling.place",
      target: route53.RecordTarget.fromAlias(
        new route53targets.ElasticBeanstalkEnvironmentEndpointTarget(
          `jp-main.${this.region}.elasticbeanstalk.com`
        )
      ),
    });

    new route53.ARecord(this, "JournalingPlaceStagingAlias", {
      zone,
      recordName: "staging.journaling.place",
      target: route53.RecordTarget.fromAlias(
        new route53targets.ElasticBeanstalkEnvironmentEndpointTarget(
          `jp-staging.${this.region}.elasticbeanstalk.com`
        )
      ),
    });

    new acm.Certificate(this, "journaling.place", {
      domainName: "journaling.place",
      subjectAlternativeNames: ["*.journaling.place"],
      validation: acm.CertificateValidation.fromDns(zone),
    });
  }
}
