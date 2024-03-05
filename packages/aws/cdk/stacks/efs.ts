import * as cdk from "aws-cdk-lib/core";
import * as efs from "aws-cdk-lib/aws-efs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class EfsStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const defaultVPC = ec2.Vpc.fromLookup(this, "DefaultVpc", {
      isDefault: true,
    });

    const defaultSecurityGroup = ec2.SecurityGroup.fromLookupByName(
      this,
      "DefaultSecurityGroup",
      "default",
      defaultVPC
    );

    const fileSystem = new efs.FileSystem(this, "EfsFileSystem", {
      encrypted: true,
      fileSystemName: "jp-efs",
      securityGroup: defaultSecurityGroup,
      vpc: defaultVPC,
    });

    new cdk.CfnOutput(this, "EfsFileSystemId", {
      value: fileSystem.fileSystemId,
    });

    new cdk.CfnOutput(this, "EfsSecurityGroupId", {
      value: defaultSecurityGroup.securityGroupId,
    });
  }
}
