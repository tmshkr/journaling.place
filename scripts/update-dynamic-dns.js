const { execSync } = require("child_process");

const { APP_NAME, DNS_USERNAME, DNS_PASSWORD, TARGET_ENV } = process.env;

async function updateDNS() {
  const stdout = execSync(
    `aws elasticbeanstalk describe-environments --application-name ${APP_NAME}`
  );

  const { Environments } = JSON.parse(stdout);
  const targetEnv = Environments.find(
    ({ EnvironmentName, Status }) =>
      EnvironmentName === TARGET_ENV && Status !== "Terminated"
  );

  if (!targetEnv) {
    throw new Error("Target environment does not exist.");
  }

  const dnsResponse = execSync(`curl -X POST \
  'https://${DNS_USERNAME}:${DNS_PASSWORD}@domains.google.com/nic/update?hostname=journaling.place&myip=${targetEnv.EndpointURL}'`);

  console.log(dnsResponse.toString());
}

async function main() {
  let tries = 0;
  while (tries < 6) {
    try {
      await updateDNS();
      break;
    } catch (error) {
      const seconds = 2 ** tries;
      tries++;
      console.error(error);
      console.log(`Retrying in ${seconds}s...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * seconds));
    }
  }
}

main();
