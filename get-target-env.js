const { exec } = require("child_process");
require("dotenv").config();
const { APP_NAME, BLUE_ENV, GREEN_ENV, PRODUCTION_CNAME, STAGING_CNAME } =
  process.env;

async function getTargetEnv() {
  return new Promise((resolve, reject) => {
    exec(
      `aws elasticbeanstalk describe-environments --application-name ${APP_NAME}`,
      async (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error.message}`);
          return reject();
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return reject();
        }

        const { Environments } = JSON.parse(stdout);
        const targetEnv = Environments.find(
          ({ CNAME, Status }) =>
            CNAME.startsWith(STAGING_CNAME) && Status !== "Terminated"
        );

        if (!targetEnv) {
          console.error("Target environment does not exist.");
          const prodEnv = Environments.find(
            ({ CNAME, Status }) =>
              CNAME.startsWith(PRODUCTION_CNAME) && Status !== "Terminated"
          );
          const newEnv =
            prodEnv?.EnvironmentName === GREEN_ENV ? BLUE_ENV : GREEN_ENV;
          await createEnvironment(newEnv);
          return resolve(await getTargetEnv());
        }

        if (targetEnv.Status !== "Ready") {
          console.error("Target environment is not ready.");
          return reject();
        }

        if (targetEnv.Health !== "Green") {
          console.log("Target environment is not healthy.");
          await terminateEnvironment(targetEnv.EnvironmentId);
          await createEnvironment(targetEnv.EnvironmentName);
          return resolve(await getTargetEnv());
        }

        resolve(targetEnv);
      }
    );
  });
}

async function createEnvironment(envName) {
  console.log("Creating new environment... ", envName);
  return new Promise((resolve, reject) => {
    exec(
      `aws elasticbeanstalk create-environment --application-name ${APP_NAME} --environment-name ${envName} --cname-prefix ${STAGING_CNAME} --template-name single-instance`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error.message}`);
          return reject();
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return reject();
        }
        const newEnv = JSON.parse(stdout);
        console.log("Creating env:", newEnv);
        exec(
          `aws elasticbeanstalk wait environment-exists --environment-ids ${newEnv.EnvironmentId}`,
          (error, stdout, stderr) => {
            console.log(stdout);
            console.log("Created environment");
            resolve(newEnv);
          }
        );
      }
    );
  });
}

async function terminateEnvironment(environmentId) {
  console.log("Terminating environment... ", environmentId);
  return new Promise((resolve, reject) => {
    exec(
      `aws elasticbeanstalk terminate-environment --environment-id ${environmentId}`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error.message}`);
          return reject();
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          reject();
          return reject();
        }
        console.log(stdout);
        exec(
          `aws elasticbeanstalk wait environment-terminated --environment-ids ${environmentId}`,
          (error, stdout, stderr) => {
            console.log(stdout);
            console.log("Terminated environment");
            resolve();
          }
        );
      }
    );
  });
}

async function main() {
  let tries = 0;
  while (tries < 5) {
    try {
      const targetEnv = await getTargetEnv();
      if (!targetEnv) return;
      console.log("targetEnv", targetEnv);
      exec(`echo TARGET_ENV=${targetEnv.EnvironmentName} >> $GITHUB_OUTPUT`);
      break;
    } catch (error) {
      tries++;
      console.log("Retrying...");
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** tries));
    }
  }
}

main();
