import * as cdk from "aws-cdk-lib";
import { IAMConfig } from "./iam";

const app = new cdk.App();
new IAMConfig(app, "JP-CDK-IAM");
