import * as cdk from "aws-cdk-lib";
import { StorageStack } from "./stacks/storage";
import { EC2Stack } from "./stacks/ec2";

const env = {
  region: process.env.CDK_DEFAULT_REGION,
  account: process.env.CDK_DEFAULT_ACCOUNT,
};
const app = new cdk.App();
new StorageStack(app, "StorageStack", { env });
new EC2Stack(app, "EC2Stack", { env });
