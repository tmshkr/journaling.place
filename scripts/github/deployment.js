const { execSync } = require("child_process");

const {
  COMMIT_MESSAGE,
  GITHUB_REF_NAME,
  NGROK_TUNNELS,
  SSH_COMMAND,
  SSH_HOST_PUBLIC_KEY,
} = process.env;

const op = process.argv[2];
const id = process.argv[3];

switch (op) {
  case "create":
    createDeployment();
    break;
  case "update":
    if (!id) throw new Error("No deployment id provided");
    updateDeployment(id);
    break;
  case "get":
    if (!id) throw new Error("No deployment id provided");
    else if (id === "all") {
      getAllDeployments();
    } else {
      getDeployment(id);
    }
    break;
  case "delete":
    if (!id) throw new Error("No deployment id provided");
    else if (id === "all") {
      deleteAllDeployments();
    } else {
      deleteDeployment(id);
    }
    break;
  default:
    console.log("Invalid operation");
    break;
}

function createDeployment() {
  console.log("Creating deployment");
  console.log("Commit message: ", COMMIT_MESSAGE);
  const res = JSON.parse(
    execSync(`
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
  })}'`)
  );
  console.log(res);
  return res;
}

function getAllDeployments() {
  console.log("Getting deployment");
  const res = JSON.parse(
    execSync(`
  gh api \
  --method GET \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/tmshkr/journaling.place/deployments`)
  );
  console.log(res);

  return res;
}

function getDeployment(id) {
  console.log(`Getting deployment ${id}`);
  const res = JSON.parse(
    execSync(`
  gh api \
  --method GET \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/tmshkr/journaling.place/deployments/${id}`)
  );

  return res;
}

function deleteDeployment(id) {
  if (!id) {
    throw new Error("No deployment id provided");
  }

  console.log(`Deleting deployment ${id}`);
  execSync(`
  gh api \
  --method DELETE \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/tmshkr/journaling.place/deployments/${id}`);
}

function deleteAllDeployments() {
  console.log("Deleting all deployments");

  const deployments = getAllDeployments();
  for (const deployment of deployments) {
    deleteDeployment(deployment.id);
  }
}
