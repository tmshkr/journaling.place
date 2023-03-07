const { execSync } = require("child_process");
const { retry } = require("./utils/retry");

const { TARGET_ENV, VERSION_LABEL } = process.env;

function verifyDeployment() {
  const targetEnv = JSON.parse(
    execSync(
      `aws elasticbeanstalk describe-environments --environment-names ${TARGET_ENV}`
    )
  ).Environments[0];

  if (targetEnv.VersionLabel !== VERSION_LABEL) {
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
