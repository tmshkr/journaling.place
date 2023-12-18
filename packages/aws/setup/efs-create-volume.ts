import { EC2Client, DescribeSubnetsCommand } from "@aws-sdk/client-ec2";
import {
  EFSClient,
  CreateFileSystemCommand,
  CreateMountTargetCommand,
} from "@aws-sdk/client-efs";
const efsClient = new EFSClient();
const ec2Client = new EC2Client();

async function run() {
  const { FileSystemId } = await efsClient
    .send(
      new CreateFileSystemCommand({
        CreationToken: "jp-efs-vol",
        PerformanceMode: "generalPurpose",
        Encrypted: true,
      })
    )
    .catch((err) => {
      if (err.name === "FileSystemAlreadyExists") {
        return { FileSystemId: err.FileSystemId };
      } else throw err;
    });

  const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({}));
  for (const subnet of Subnets) {
    console.log(`Creating mount target in ${subnet.AvailabilityZone}`);
    await efsClient.send(
      new CreateMountTargetCommand({
        FileSystemId,
        SubnetId: subnet.SubnetId,
      })
    );
  }
}

run();
