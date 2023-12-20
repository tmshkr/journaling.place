import * as s3 from "aws-cdk-lib/aws-s3";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";

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
          id: "Delete after 90 days",
          expiration: cdk.Duration.days(90),
          noncurrentVersionExpiration: cdk.Duration.days(3),
        },
        { id: "Remove delete markers", expiredObjectDeleteMarker: true },
      ],
    });

    backupBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: "AllowEC2ToPutObject",
        actions: ["s3:PutObject"],
        effect: iam.Effect.ALLOW,
        resources: [`${backupBucket.bucketArn}/*`],
        principals: [
          new iam.ArnPrincipal(cdk.Fn.importValue("BeanstalkInstanceRoleARN")),
        ],
      })
    );

    new cdk.CfnOutput(this, "BackupBucketName", {
      value: backupBucket.bucketName,
      exportName: "BackupBucketName",
    });
  }
}
