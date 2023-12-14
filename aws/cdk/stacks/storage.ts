import * as s3 from "aws-cdk-lib/aws-s3";
import * as cdk from "aws-cdk-lib";

export class StorageStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const backupBucket = new s3.Bucket(this, "JournalingPlaceBackups", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(90),
          noncurrentVersionExpiration: cdk.Duration.days(3),
        },
        {
          expiredObjectDeleteMarker: true,
        },
      ],
    });

    new cdk.CfnOutput(this, "backupBucketArn", {
      value: backupBucket.bucketArn,
      exportName: "backupBucketArn",
    });
  }
}
