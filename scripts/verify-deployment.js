const { execSync } = require("child_process");
const { retry } = require("./utils/retry");

function verifyDeployment() {
  const versionLabel = process.argv[2];
  const targetEnv = JSON.parse(
    execSync(
      `aws elasticbeanstalk describe-environments --environment-names jp-green`
    )
  ).Environments[0];

  if (targetEnv.VersionLabel !== versionLabel) {
    throw new Error("Target environment is not running the specified version.");
  }
  if (targetEnv.Status !== "Ready") {
    throw new Error("Target environment is not ready.");
  }
  if (targetEnv.Health !== "Green") {
    throw new Error("Target environment is not healthy.");
  }

  console.log("Target environment is ready", targetEnv);
}

async function run() {
  await retry(verifyDeployment);
}

run();
