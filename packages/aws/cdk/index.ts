import * as cdk from "aws-cdk-lib";
import { StorageStack } from "./stacks/storage";

const app = new cdk.App();
new StorageStack(app, "StorageStack");
