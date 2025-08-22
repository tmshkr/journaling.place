import * as s3 from "aws-cdk-lib/aws-s3";
import * as cdk from "aws-cdk-lib";

export class StorageStack extends cdk.Stack {
  backupBucket: s3.Bucket;
  configBucket: s3.Bucket;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.backupBucket = new s3.Bucket(this, "JournalingPlaceBackups", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          id: "Delete after 365 days",
          expiration: cdk.Duration.days(365),
          noncurrentVersionExpiration: cdk.Duration.days(3),
        },
        { id: "Remove delete markers", expiredObjectDeleteMarker: true },
      ],
    });

    new cdk.CfnOutput(this, "BackupBucketName", {
      value: this.backupBucket.bucketName,
      exportName: "BackupBucketName",
    });

    this.configBucket = new s3.Bucket(this, "JournalingPlaceConfig", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      enforceSSL: true,
      versioned: true,
    });


    new cdk.CfnOutput(this, "ConfigBucketName", {
      value: this.configBucket.bucketName,
      exportName: "ConfigBucketName",
    });
  }
}
