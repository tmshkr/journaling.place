import * as cdk from "aws-cdk-lib";
import { ALBStack } from "./stacks/alb";
import { EC2Stack } from "./stacks/ec2";
import { StorageStack } from "./stacks/storage";

const env = {
  region: process.env.CDK_DEFAULT_REGION,
  account: process.env.CDK_DEFAULT_ACCOUNT,
};
const app = new cdk.App();
new ALBStack(app, "ALBStack", { env });
new EC2Stack(app, "EC2Stack", { env });
new StorageStack(app, "StorageStack", { env });
