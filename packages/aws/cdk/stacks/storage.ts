import * as efs from 'aws-cdk-lib/aws-efs';
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export interface StorageStackProps extends cdk.StackProps {
  readonly vpc: ec2.IVpc;
  readonly instanceRole: iam.Role;
  readonly securityGroup: ec2.ISecurityGroup;
}

export class StorageStack extends cdk.Stack {
  backupBucket: s3.Bucket;
  efsFileSystem: efs.FileSystem;

  constructor(scope: cdk.App, id: string, props: StorageStackProps) {
    super(scope, id, props);

    this.backupBucket = new s3.Bucket(this, "JournalingPlaceBackups", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          id: "Expire noncurrent versions after 365 days",
          noncurrentVersionExpiration: cdk.Duration.days(365),
        }
      ],
    });

    this.backupBucket.grantWrite(props.instanceRole);

    new cdk.CfnOutput(this, "BackupBucketName", {
      value: this.backupBucket.bucketName,
      exportName: "BackupBucketName",
    });

    this.efsFileSystem = new efs.FileSystem(this, 'EfsFileSystem', {
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      throughputMode: efs.ThroughputMode.BURSTING,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      securityGroup: props.securityGroup,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    this.exportValue(this.efsFileSystem.fileSystemId, {
      name: 'EfsFileSystemId',
      description: 'EFS FileSystem ID'
    });
  }
}
