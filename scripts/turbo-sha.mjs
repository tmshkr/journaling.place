#!/usr/bin/env node
import { execSync } from "child_process";
import { appendFileSync, readFileSync, writeFileSync } from "fs";
import crypto from "crypto";

const { GITHUB_OUTPUT, GITHUB_REF_NAME, GITHUB_REPOSITORY, GITHUB_SHA } =
  process.env;

main();
async function main() {
  const versionLabel = `${GITHUB_REF_NAME.replaceAll("/", "_")}.${GITHUB_SHA}`;
  const turboTag = `turbo.${getTurboHash()}`;
  appendFileSync(GITHUB_OUTPUT, `TURBO_TAG=${turboTag}\n`);
  appendFileSync(GITHUB_OUTPUT, `VERSION_LABEL=${versionLabel}\n`);

  const imageExists = await fetch(
    `https://hub.docker.com/v2/repositories/${GITHUB_REPOSITORY}/tags/${turboTag}`
  ).then((res) => {
    return res.ok ? true : false;
  });

  if (imageExists) {
    console.log(
      `Adding tag ${versionLabel} to ${GITHUB_REPOSITORY}:${turboTag}`
    );
    execSync(
      `docker buildx imagetools create ${GITHUB_REPOSITORY}:${turboTag} --tag ${GITHUB_REPOSITORY}:${versionLabel}`,
      { stdio: "inherit" }
    );
    console.log(`Skipping build...`);
    appendFileSync(GITHUB_OUTPUT, "SKIP_BUILD=true\n");
  } else {
    console.log(`No image with tag [${turboTag}]`);
    console.log(`Proceeding with build...`);
    appendFileSync(GITHUB_OUTPUT, "SKIP_BUILD=false\n");
  }
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

  // console.log(`Turbo build:`, build);
  const { hashOfExternalDependencies, hashOfInternalDependencies, files } =
    build.globalCacheInputs;
  const data = {
    hashOfExternalDependencies,
    hashOfInternalDependencies,
    files,
    tasks: [],
  };

  for (const key in data) {
    if (!data[key]) {
      throw new Error("Missing data:", { [key]: data[key] });
    }
  }

  for (const { taskId, hash, hashOfExternalDependencies } of build.tasks) {
    const task = { taskId, hash, hashOfExternalDependencies };
    for (const key in task) {
      if (!task[key]) {
        throw new Error("Missing data:", { [key]: task[key] });
      }
    }
    data.tasks.push(task);
  }

  if (!data.tasks.length) {
    throw new Error("No tasks found");
  }

  // console.log(`Turbo hash data:`, data);
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
}
