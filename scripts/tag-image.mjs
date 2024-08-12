#!/usr/bin/env node
import { execSync } from "child_process";

export function tagEcrImage(repo, currentTag, newTags) {
  console.log("Tagging image", { currentTag, newTags });
  const { images, failures } = JSON.parse(
    execSync(
      `aws ecr batch-get-image --repository-name ${repo} --image-ids imageTag=${currentTag} --output json`
    )
  );

  for (const fail of failures) {
    console.log(fail);
  }

  const image = images[0];
  for (const tag of newTags.split(",")) {
    try {
      execSync(
        `aws ecr put-image --repository-name journaling.place --image-tag ${tag} --image-manifest '${image.imageManifest}'`,
        { stdio: "pipe" }
      );
      console.log(`Image tagged with ${tag}`);
    } catch (err) {
      if (err.toString().includes("ImageAlreadyExistsException")) {
        console.log(`Image already tagged with ${tag}`);
      } else {
        throw err.toString();
      }
    }
  }
}
