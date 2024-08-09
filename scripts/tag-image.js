#!/usr/bin/env node
const { execSync } = require("child_process");
const { CURRENT_TAG, NEW_TAG } = process.env;
if (!CURRENT_TAG || !NEW_TAG) {
  throw new Error("CURRENT_TAG and NEW_TAG must be set");
}

console.log("Tagging image", { CURRENT_TAG, NEW_TAG });

const { images, failures } = JSON.parse(
  execSync(
    `aws ecr batch-get-image --repository-name journaling.place --image-ids imageTag=${CURRENT_TAG} --output json`
  )
);

for (const fail of failures) {
  console.log(fail);
}

for (const image of images) {
  try {
    execSync(
      `aws ecr put-image --repository-name journaling.place --image-tag ${NEW_TAG} --image-manifest '${image.imageManifest}'`,
      { stdio: "pipe" }
    );
    console.log("Image tagged", image.imageId);
  } catch (err) {
    if (err.toString().includes("ImageAlreadyExistsException")) {
      console.log("Image already exists");
    } else {
      throw err.toString();
    }
  }
}
