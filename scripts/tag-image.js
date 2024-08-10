#!/usr/bin/env node
const { execSync } = require("child_process");
const { CURRENT_TAG, NEW_TAGS } = process.env;
if (!CURRENT_TAG || !NEW_TAGS) {
  throw new Error("CURRENT_TAG and NEW_TAGS must be set");
}

console.log("Tagging image", { CURRENT_TAG, NEW_TAGS });

const { images, failures } = JSON.parse(
  execSync(
    `aws ecr batch-get-image --repository-name journaling.place --image-ids imageTag=${CURRENT_TAG} --output json`
  )
);

for (const fail of failures) {
  console.log(fail);
}

const image = images[0];
for (const tag of NEW_TAGS.split(",")) {
  try {
    execSync(
      `aws ecr put-image --repository-name journaling.place --image-tag ${tag} --image-manifest '${image.imageManifest}'`,
      { stdio: "pipe" }
    );
    console.log("Image tagged", image.imageId);
  } catch (err) {
    if (err.toString().includes("ImageAlreadyExistsException")) {
      console.log(`Image already tagged with ${tag}`);
    } else {
      throw err.toString();
    }
  }
}
