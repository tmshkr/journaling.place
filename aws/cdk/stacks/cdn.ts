import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";

export class CdnStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cdnBucket = new s3.Bucket(this, "cdn.journaling.place", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
    });

    const cdnOrigin = new origins.S3Origin(cdnBucket);

    const distro = new cloudfront.Distribution(this, "distro", {
      defaultBehavior: {
        origin: cdnOrigin,
      },
      additionalBehaviors: {
        "_next/static/*": {
          origin: new origins.OriginGroup({
            primaryOrigin: cdnOrigin,
            fallbackOrigin: new origins.HttpOrigin("journaling.place"),
            fallbackStatusCodes: [404],
          }),
        },
      },
    });

    const allowCloudFrontReadOnlyPolicy = new iam.PolicyStatement({
      actions: ["s3:GetObject"],
      principals: [new iam.ServicePrincipal("cloudfront.amazonaws.com")],
      effect: iam.Effect.ALLOW,
      conditions: {
        StringEquals: {
          "AWS:SourceArn": distro.distributionId,
        },
      },
    });

    cdnBucket.addToResourcePolicy(allowCloudFrontReadOnlyPolicy);
  }
}
