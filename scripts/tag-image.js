#!/usr/bin/env node
const { execSync } = require("child_process");
const { GITHUB_SHA, TAG } = process.env;

const { images } = JSON.parse(
  execSync(
    `aws ecr batch-get-image --repository-name journaling.place --image-ids imageTag=${GITHUB_SHA} --output json`
  )
);
try {
  execSync(
    `aws ecr put-image --repository-name journaling.place --image-tag ${TAG} --image-manifest '${images[0].imageManifest}'`,
    { stdio: "pipe" }
  );
} catch (err) {
  if (err.toString().includes("ImageAlreadyExistsException")) {
    console.log("Image already exists");
  } else {
    throw err.toString();
  }
}
