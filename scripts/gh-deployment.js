const { execSync } = require("child_process");

const {
  COMMIT_MESSAGE,
  GITHUB_REF_NAME,
  NGROK_TUNNELS,
  SSH_COMMAND,
  SSH_HOST_PUBLIC_KEY,
} = process.env;

function createDeployment() {
  const res = execSync(`
  gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/tmshkr/journaling.place/deployments \
  -f ref='${GITHUB_REF_NAME}' \
  -f payload='${JSON.stringify({
    NGROK_TUNNELS,
    SSH_COMMAND,
    SSH_HOST_PUBLIC_KEY,
  })}' \
  -f description='${COMMIT_MESSAGE}'
  `);
  console.log(JSON.parse(res.toString()));
}

createDeployment();
