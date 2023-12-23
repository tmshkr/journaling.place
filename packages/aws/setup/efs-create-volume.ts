import { EC2Client, DescribeSubnetsCommand } from "@aws-sdk/client-ec2";
import { SSMClient, PutParameterCommand } from "@aws-sdk/client-ssm";
import {
  EFSClient,
  CreateFileSystemCommand,
  CreateMountTargetCommand,
} from "@aws-sdk/client-efs";
const efsClient = new EFSClient();
const ec2Client = new EC2Client();
const ssmClient = new SSMClient();

async function run() {
  const { FileSystemId } = await efsClient
    .send(
      new CreateFileSystemCommand({
        CreationToken: "jp-efs-vol",
        PerformanceMode: "generalPurpose",
        Encrypted: true,
      })
    )
    .then(({ FileSystemId }) => {
      console.log(`Created EFS volume ${FileSystemId}`);
      return { FileSystemId };
    })
    .catch((err) => {
      if (err.name === "FileSystemAlreadyExists") {
        console.log(`EFS volume already exists ${err.FileSystemId}`);
        return { FileSystemId: err.FileSystemId };
      } else throw err;
    });

  const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({}));
  for (const subnet of Subnets) {
    await efsClient
      .send(
        new CreateMountTargetCommand({
          FileSystemId,
          SubnetId: subnet.SubnetId,
        })
      )
      .then(() => {
        console.log(`Mount target created in ${subnet.AvailabilityZone}`);
      })
      .catch((err) => {
        if (err.name === "MountTargetConflict") {
          console.log(
            `Mount target already exists in ${subnet.AvailabilityZone}`
          );
        } else throw err;
      });
  }

  await ssmClient
    .send(
      new PutParameterCommand({
        Name: "/journaling.place/EFS_VOLUME_ID",
        Value: FileSystemId,
        Type: "String",
        Overwrite: true,
      })
    )
    .then(() => {
      console.log("SSM parameter created");
    });
}

run();
