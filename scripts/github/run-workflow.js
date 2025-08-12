#!/usr/bin/env node
const { execSync } = require("child_process");
const osType = require("os").type();
const [bin, file, workflowId, ...options] = process.argv;

if (!workflowId) {
  throw new Error("Workflow ID is required");
}

const startTime = new Date();

execSync(
  `gh workflow run ${workflowId} --ref $(git rev-parse --abbrev-ref HEAD) ${options.join(
    " "
  )}`,
  { stdio: "inherit" }
);

getRunUrl();

async function getRunUrl() {
  const { url, createdAt } =
    JSON.parse(
      execSync(
        `gh run list --workflow ${workflowId} --commit $(git rev-parse HEAD) --event workflow_dispatch --limit 1 --json url,createdAt`
      )
    )[0] || {};

  if (new Date(createdAt || 0) >= startTime) {
    console.log(`Workflow Run URL: ${url}`);
    if (osType === "Darwin") {
      execSync(`open ${url}`);
    } else if (osType === "Windows_NT") {
      execSync(`start ${url}`);
    }
  } else {
    console.log("Waiting for the workflow run to start...");
    await new Promise(() => setTimeout(getRunUrl, 5000));
  }
}
