#!/usr/bin/env node
import { execSync } from "child_process";
import { appendFileSync, readFileSync } from "fs";
import crypto from "crypto";
import { tagEcrImage } from "./tag-image.mjs";
const {
  GITHUB_ENV,
  GITHUB_OUTPUT,
  GITHUB_REF_NAME,
  GITHUB_REPOSITORY,
  GITHUB_SHA,
} = process.env;

main();
function main() {
  const repo = GITHUB_REPOSITORY.split("/")[1];
  const versionLabel = `${GITHUB_REF_NAME.replaceAll("/", "_")}.${GITHUB_SHA}`;
  const turboTag = `turbo.${getTurboHash()}`;
  appendFileSync(GITHUB_ENV, `TURBO_TAG=${turboTag}\n`);
  appendFileSync(GITHUB_OUTPUT, `TURBO_TAG=${turboTag}\n`);

  const imageDetails = getImageDetails(repo, turboTag);
  if (!imageDetails) {
    console.log(`Image with tag [${turboTag}] not found.`);
    console.log(`Proceeding with build...`);
    return;
  }

  console.log(`Image found with tag [${turboTag}]`, imageDetails);
  console.log(`Adding version label tag [${versionLabel}]`);
  tagEcrImage(turboTag, versionLabel);
  console.log(`Skipping build...`);
  appendFileSync(GITHUB_OUTPUT, "SKIP_BUILD=true\n");
}

function getTurboHash() {
  try {
    const version = JSON.parse(readFileSync("package.json")).dependencies.turbo;
    const turbo = `turbo@${version}`;
    execSync(`npx ${turbo} --version`, { stdio: "inherit" });
    var build = JSON.parse(
      execSync(`npx ${turbo} run build --filter='./apps/*' --dry=json`)
    );
  } catch (err) {
    throw new Error(err.toString());
  }

  console.log(`Turbo build:`, build);
  const { hashOfExternalDependencies, hashOfInternalDependencies } =
    build.globalCacheInputs;
  if (!hashOfExternalDependencies || !hashOfInternalDependencies) {
    throw new Error(
      `Missing data: ${{
        hashOfExternalDependencies,
        hashOfInternalDependencies,
      }}`
    );
  }
  const tasks = [];
  for (const { taskId, hash, hashOfExternalDependencies } of build.tasks) {
    if (!taskId || !hash || !hashOfExternalDependencies) {
      throw new Error(
        `Missing data: ${{ taskId, hash, hashOfExternalDependencies }}`
      );
    }
    tasks.push({ taskId, hash, hashOfExternalDependencies });
  }
  if (!tasks.length) {
    throw new Error(`No tasks found`);
  }
  const data = {
    hashOfExternalDependencies,
    hashOfInternalDependencies,
    tasks,
  };
  console.log(`Turbo hash data:`, data);
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
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
    return false;
  }
}