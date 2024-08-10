#!/usr/bin/env node
import { execSync } from "child_process";
import { appendFileSync } from "fs";
import crypto from "crypto";
import { tagEcrImage } from "./tag-image";

const { GITHUB_ENV, GITHUB_REPOSITORY, GITHUB_SHA } = process.env;

main();
function main() {
  const repo = GITHUB_REPOSITORY.split("/")[1];
  const githubSha = `github.${GITHUB_SHA}`;
  const turboSha = getTurboHashTag();
  appendFileSync(GITHUB_ENV, `TURBO_SHA=${turboSha}\n`);
  const imageDetails = getImageDetails(repo, turboSha);
  if (!imageDetails) {
    console.log(`Image with tag [${turboSha}] not found.`);
    console.log(`Proceeding with build...`);
    return;
  }
  console.log(imageDetails);
  console.log(`Image found with tag [${turboSha}]`);
  console.log(`Adding GITHUB_SHA tag [${githubSha}]`);
  tagEcrImage(turboSha, githubSha);
  console.log(`Skipping build...`);
  appendFileSync(GITHUB_ENV, "SKIP_BUILD=true\n");
}

function getTurboHashTag() {
  const build = JSON.parse(execSync(`npx turbo run build --dry=json`));
  const globalHash = build.globalCacheInputs.hashOfExternalDependencies;
  const taskHashes = [];
  for (const { taskId, hash } of build.tasks) {
    taskHashes.push({ taskId, hash });
  }

  const data = JSON.stringify({ globalHash, taskHashes });
  const tag = `build.turbo.${crypto
    .createHash("sha256")
    .update(data)
    .digest("hex")}`;
  return tag;
}

function getImageDetails(repo, tag) {
  console.log(`Checking ECR for image with tag [${tag}]`);
  try {
    return JSON.parse(
      execSync(
        `aws ecr describe-images --repository-name ${repo} --image-ids imageTag=${tag}`,
        { stdio: "pipe" }
      )
    ).imageDetails[0];
  } catch (err) {
    if (!err.toString().includes("ImageNotFoundException")) {
      throw err.toString();
    }
  }
}
