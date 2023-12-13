import * as iam from "aws-cdk-lib/aws-iam";
import * as cdk from "aws-cdk-lib";

export class JournalingPlace extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const provider = new iam.OpenIdConnectProvider(this, "GitHubActions", {
      url: "https://token.actions.githubusercontent.com",
      clientIds: ["sts.amazonaws.com"],
    });

    new iam.Role(this, "GitHubActionsRole", {
      assumedBy: new iam.FederatedPrincipal(
        provider.openIdConnectProviderArn,
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
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMReadOnlyAccess"),
      ],
    });

    new iam.Role(this, "aws-elasticbeanstalk-ec2-role", {
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
    });

    new iam.Role(this, "aws-elasticbeanstalk-service-role", {
      assumedBy: new iam.ServicePrincipal("elasticbeanstalk.amazonaws.com"),
      path: "/service-role/",
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

const app = new cdk.App();
new JournalingPlace(app, "JournalingPlace");
