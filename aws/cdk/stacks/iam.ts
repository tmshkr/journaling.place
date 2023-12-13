import * as iam from "aws-cdk-lib/aws-iam";
import * as cdk from "aws-cdk-lib";

export class IamStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const githubActions = new iam.OpenIdConnectProvider(this, "GitHubActions", {
      url: "https://token.actions.githubusercontent.com",
      clientIds: ["sts.amazonaws.com"],
    });

    new iam.Role(this, "GitHubActionsRole", {
      assumedBy: new iam.FederatedPrincipal(
        githubActions.openIdConnectProviderArn,
        {
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          },
          StringLike: {
            "token.actions.githubusercontent.com:sub":
              "repo:tmshkr/journaling.place:*",
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
      roleName: "GitHubActionsRole",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AdministratorAccess-AWSElasticBeanstalk"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "ElasticLoadBalancingFullAccess"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMReadOnlyAccess"),
      ],
      inlinePolicies: {
        s3WriteAccess: iam.PolicyDocument.fromJson({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: "s3:PutObject",
              Resource: ["arn:aws:s3:::cdn.journaling.place/*"],
            },
          ],
        }),
      },
    });

    const ec2Role = new iam.Role(this, "aws-elasticbeanstalk-ec2-role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      roleName: "aws-elasticbeanstalk-ec2-role",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AWSElasticBeanstalkWebTier"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AWSElasticBeanstalkMulticontainerDocker"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AWSElasticBeanstalkWorkerTier"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonSSMManagedInstanceCore"
        ),
      ],
      inlinePolicies: {
        s3WriteAccess: iam.PolicyDocument.fromJson({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: "s3:PutObject",
              Resource: [`${cdk.Fn.importValue("backupBucketArn")}/*`],
            },
          ],
        }),
      },
    });

    new iam.InstanceProfile(this, "aws-elasticbeanstalk-ec2-profile", {
      instanceProfileName: "aws-elasticbeanstalk-ec2-role",
      role: ec2Role,
    });

    new iam.Role(this, "aws-elasticbeanstalk-service-role", {
      assumedBy: new iam.PrincipalWithConditions(
        new iam.ServicePrincipal("elasticbeanstalk.amazonaws.com"),
        {
          StringEquals: {
            "sts:ExternalId": "elasticbeanstalk",
          },
        }
      ),
      roleName: "aws-elasticbeanstalk-service-role",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSElasticBeanstalkEnhancedHealth"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy"
        ),
      ],
    });
  }
}
