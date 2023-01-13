const { exec } = require("child_process");

async function getTargetEnv() {
  return new Promise((resolve, reject) => {
    exec(
      `aws elasticbeanstalk describe-environments --application-name ${process.env.APP_NAME}`,
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

        const { Environments } = JSON.parse(stdout);
        const targetEnv = Environments.find(({ CNAME }) =>
          CNAME.startsWith(process.env.STAGING_CNAME)
        );
        if (!targetEnv) {
          console.error("No target environment found");
          reject();
          return;
        }
        if (targetEnv.Status !== "Ready") {
          console.error("Target environment is not ready");
          reject();
          return;
        }

        resolve(targetEnv);
      }
    );
  });
}

async function main() {
  let tries = 0;
  while (tries < 5) {
    try {
      var targetEnv = await getTargetEnv();
      exec(`echo TARGET_ENV=${targetEnv.EnvironmentName} >> $GITHUB_OUTPUT`);
      break;
    } catch (error) {
      tries++;
      console.log("Retrying...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

main();
