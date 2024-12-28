import * as cdk from "aws-cdk-lib";
import { AlbStack } from "./stacks/alb";
import { EC2Stack } from "./stacks/ec2";
import { IamStack } from "./stacks/iam";
import { StorageStack } from "./stacks/storage";

const env = {
  region: process.env.CDK_DEFAULT_REGION,
  account: process.env.CDK_DEFAULT_ACCOUNT,
};

const vars = getEnvVars();

const app = new cdk.App();
const { backupBucket } = new StorageStack(app, "StorageStack", { env });
new IamStack(app, "IamStack", {
  env,
  backupBucket,
  repositoryConfig: [vars.repositoryConfig],
});
new AlbStack(app, "AlbStack", { env });
new EC2Stack(app, "EC2Stack", { env });

function getEnvVars() {
  const vars = {
    repositoryConfig: {
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
    },
  };
  for (const key in vars) {
    if (!vars[key as keyof typeof vars]) {
      throw new Error(`Environment variable ${key} is missing`);
    }
  }

  return vars;
}
