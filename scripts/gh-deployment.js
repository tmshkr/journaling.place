const { execSync } = require("child_process");

const {
  COMMIT_MESSAGE,
  GITHUB_REF_NAME,
  NGROK_TUNNELS,
  SSH_COMMAND,
  SSH_HOST_PUBLIC_KEY,
} = process.env;

function createDeployment() {
  console.log("Creating deployment");
  console.log("Commit message: ", COMMIT_MESSAGE);
  const res = execSync(`
  gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/tmshkr/journaling.place/deployments \
  -f ref='${GITHUB_REF_NAME}' \
  -f payload='${JSON.stringify({
    NGROK_TUNNELS: JSON.parse(NGROK_TUNNELS),
    SSH_COMMAND,
    SSH_HOST_PUBLIC_KEY,
  })}'
  `);
  console.log(JSON.parse(res.toString()));
}

createDeployment();
