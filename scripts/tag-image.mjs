#!/usr/bin/env node
import { execSync } from "child_process";

const { GITHUB_REPOSITORY, CURRENT_TAG, NEW_TAGS, TAGS_TO_REMOVE } =
  process.env;
const repo = GITHUB_REPOSITORY.split("/")[1];

if (CURRENT_TAG && NEW_TAGS) {
  tagEcrImage(CURRENT_TAG, NEW_TAGS);
}

if (TAGS_TO_REMOVE) {
  untagImage(TAGS_TO_REMOVE);
}

export function tagEcrImage(currentTag, newTags) {
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
  if (!image) {
    throw new Error("Image not available");
  }
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

export function untagImage(tagsToRemove) {
  for (const tag of tagsToRemove.split(",")) {
    console.log("Untagging image", { tag });
    try {
      execSync(
        `aws ecr batch-delete-image --repository-name ${repo} --image-ids imageTag=${tag}`
      );
      console.log(`Image untagged`);
    } catch (err) {
      if (err.toString().includes("ImageNotFoundException")) {
        console.log(`Image not found`);
      } else {
        throw err.toString();
      }
    }
  }
}
