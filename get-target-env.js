const { exec } = require("child_process");

const { APP_NAME, BLUE_ENV, GREEN_ENV, PRODUCTION_CNAME, STAGING_CNAME } =
  process.env;

async function getTargetEnv() {
  return new Promise((resolve, reject) => {
    exec(
      `aws elasticbeanstalk describe-environments --application-name ${APP_NAME}`,
      async (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error.message}`);
          reject();
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          reject();
          return;
        }

        const { Environments } = JSON.parse(stdout);
        const prodEnv = Environments.find(({ CNAME }) =>
          CNAME.startsWith(PRODUCTION_CNAME)
        );
        const targetEnv = Environments.find(({ CNAME }) =>
          CNAME.startsWith(STAGING_CNAME)
        );

        if (!targetEnv || targetEnv.Status === "Terminated") {
          console.error("Target environment does not exist.");
          const newEnv = await createEnvironment(
            prodEnv.EnvironmentName === GREEN_ENV ? BLUE_ENV : GREEN_ENV
          );
          resolve(newEnv);
          return;
        }

        if (targetEnv.Status !== "Ready") {
          console.error("Target environment is not ready");
          reject();
          return;
        }

        if (targetEnv.Status === "Ready" && targetEnv.Health === "Grey") {
          console.log("Target environment inactive.");
          await terminateEnvironment(targetEnv.EnvironmentId);
          const newEnv = await createEnvironment(
            prodEnv.EnvironmentName === GREEN_ENV ? BLUE_ENV : GREEN_ENV
          );
          resolve(newEnv);
          return;
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
          reject();
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          reject();
          return;
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
          reject();
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          reject();
          return;
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
      console.log(targetEnv);
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
