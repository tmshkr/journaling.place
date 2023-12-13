import * as cdk from "aws-cdk-lib";
import { StorageStack } from "./stacks/storage";
import { IamStack } from "./stacks/iam";

const app = new cdk.App();
new StorageStack(app, "StorageStack");
new IamStack(app, "IamStack");
