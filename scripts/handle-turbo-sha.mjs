#!/usr/bin/env node
import { execSync } from "child_process";
import { appendFileSync } from "fs";
import crypto from "crypto";
import { tagEcrImage } from "./tag-image.mjs";

const { GITHUB_OUTPUT, GITHUB_REPOSITORY, GITHUB_SHA } = process.env;

main();
function main() {
  const repo = GITHUB_REPOSITORY.split("/")[1];
  const githubSha = `github.${GITHUB_SHA}`;
  const turboSha = getTurboHashTag();
  appendFileSync(GITHUB_OUTPUT, `TURBO_SHA=${turboSha}\n`);
  const imageDetails = getImageDetails(repo, turboSha);
  if (!imageDetails) {
    console.log(`Image with tag [${turboSha}] not found.`);
    console.log(`Proceeding with build...`);
    return;
  }
  console.log(`Image found with tag [${turboSha}]`, imageDetails);
  console.log(`Adding GITHUB_SHA tag [${githubSha}]`);
  tagEcrImage(turboSha, githubSha);
  console.log(`Skipping build...`);
  appendFileSync(GITHUB_OUTPUT, "SKIP_BUILD=true\n");
}

function getTurboHashTag() {
  try {
    execSync(`npx turbo --version`, { stdio: "inherit" }); // Install turbo
    var build = JSON.parse(execSync(`npx turbo run build --dry=json`));
  } catch (err) {
    throw new Error(err.toString());
  }

  const externalHash = build.globalCacheInputs.hashOfExternalDependencies;
  const internalHash = build.globalCacheInputs.hashOfInternalDependencies;
  const taskHashes = [];
  for (const { taskId, hash } of build.tasks) {
    taskHashes.push({ taskId, hash });
  }

  const data = JSON.stringify(
    {
      external: externalHash,
      internalHash,
      taskHashes,
    },
    null,
    2
  );
  console.log(`Turbo hash data:`, data);
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
