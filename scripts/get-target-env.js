const { execSync } = require("child_process");

const { APP_NAME, BLUE_ENV, GREEN_ENV, PRODUCTION_CNAME, STAGING_CNAME } =
  process.env;

function getTargetEnv(shouldWait) {
  const { Environments } = JSON.parse(
    execSync(
      `aws elasticbeanstalk describe-environments --application-name ${APP_NAME}`
    )
  );
  const targetEnv = Environments.find(
    ({ CNAME, Status }) =>
      CNAME.startsWith(STAGING_CNAME) && Status !== "Terminated"
  );

  if (!targetEnv) {
    console.log("Target environment does not exist.");
    const prodEnv = Environments.find(
      ({ CNAME, Status }) =>
        CNAME.startsWith(PRODUCTION_CNAME) && Status !== "Terminated"
    );
    const newEnv =
      prodEnv?.EnvironmentName === GREEN_ENV ? BLUE_ENV : GREEN_ENV;
    createEnvironment(newEnv, shouldWait);
    return getTargetEnv();
  }

  if (targetEnv.Status === "Launching") {
    console.log("Waiting for environment to launch...");
    execSync(
      `aws elasticbeanstalk wait environment-exists --environment-ids ${targetEnv.EnvironmentId}`
    );
    return getTargetEnv();
  }

  if (targetEnv.Status !== "Ready") {
    throw new Error("Target environment is not ready.");
  }

  if (targetEnv.Health !== "Green") {
    console.log("Target environment is not healthy.");
    terminateEnvironment(targetEnv.EnvironmentId);
    createEnvironment(targetEnv.EnvironmentName, shouldWait);
    return getTargetEnv();
  }

  return targetEnv;
}

function createEnvironment(envName, shouldWait) {
  console.log("Creating new environment... ");
  const stdout = execSync(
    `aws elasticbeanstalk create-environment --application-name ${APP_NAME} --environment-name ${envName} --cname-prefix ${STAGING_CNAME} --template-name single-instance`
  );

  const newEnv = JSON.parse(stdout);
  console.log("Creating env:", newEnv);
  if (shouldWait) {
    execSync(
      `aws elasticbeanstalk wait environment-exists --environment-ids ${newEnv.EnvironmentId}`
    );
    console.log("Created environment");
  } else {
    process.exit(0);
  }
}

function terminateEnvironment(environmentId) {
  console.log("Terminating environment... ", environmentId);
  execSync(`
    aws elasticbeanstalk terminate-environment --environment-id ${environmentId}
    aws elasticbeanstalk wait environment-terminated --environment-ids ${environmentId}
    `);

  console.log("Terminated environment");
}

async function main() {
  const shouldWait = process.argv[2] === "--wait";
  let tries = 0;
  while (tries < 6) {
    try {
      const targetEnv = getTargetEnv(shouldWait);
      console.log("targetEnv", targetEnv);
      execSync(
        `echo TARGET_ENV=${targetEnv.EnvironmentName} >> $GITHUB_OUTPUT`
      );
      return;
    } catch (error) {
      const seconds = 2 ** tries++;
      console.error(error);
      console.log(`Retrying in ${seconds}s...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * seconds));
    }
  }
  throw new Error("Failed to get target environment.");
}

main();
