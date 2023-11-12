require("dotenv").config();
const { execSync } = require("child_process");

const { ATLAS_PUBLIC_KEY, ATLAS_PRIVATE_KEY, ATLAS_GROUP_ID } = process.env;

const input = process.argv[2];

switch (input) {
  case "open":
    openAccess();
    break;
  case "restrict":
    restrictAccess();
    break;
  default:
    console.log("Unknown input");
}

function openAccess() {
  const res = execSync(`
  curl -s \
  --user "${ATLAS_PUBLIC_KEY}:${ATLAS_PRIVATE_KEY}" --digest \
  --header "Content-Type: application/json" \
  --header "Accept: application/vnd.atlas.2023-02-01+json" \
  --request POST "https://cloud.mongodb.com/api/atlas/v2/groups/${ATLAS_GROUP_ID}/accessList" \
  --data '${JSON.stringify([
    {
      cidrBlock: "0.0.0.0/0",
      deleteAfterDate: new Date(Date.now() + 1000 * 60 * 60),
    },
  ])}'`);
  console.log(JSON.parse(res));
}

function restrictAccess() {
  const myIP = execSync("curl -s https://checkip.amazonaws.com")
    .toString()
    .trim();
  const allowed = [`${myIP}/32`];

  const { Environments } = JSON.parse(
    execSync("aws elasticbeanstalk describe-environments --no-include-deleted")
  );
  Environments.forEach((env) => {
    if (env.Health !== "Grey") {
      allowed.push(`${env.EndpointURL}/32`);
    }
  });

  const { results } = JSON.parse(
    execSync(`
    curl -s \
    --user "${ATLAS_PUBLIC_KEY}:${ATLAS_PRIVATE_KEY}" --digest \
    --header "Content-Type: application/json" \
    --header "Accept: application/vnd.atlas.2023-02-01+json" \
    --request GET "https://cloud.mongodb.com/api/atlas/v2/groups/${ATLAS_GROUP_ID}/accessList"`)
  );

  const toDelete = [];
  results.forEach((access) => {
    if (!allowed.includes(access.cidrBlock)) {
      toDelete.push(access.cidrBlock);
    }
  });

  if (toDelete.length === 0) {
    console.log("No entries to delete");
    return;
  }

  toDelete.forEach((cidrBlock) => {
    execSync(`
    curl -s \
    --user "${ATLAS_PUBLIC_KEY}:${ATLAS_PRIVATE_KEY}" --digest \
    --header "Content-Type: application/json" \
    --header "Accept: application/vnd.atlas.2023-02-01+json" \
    --include \
    --request DELETE "https://cloud.mongodb.com/api/atlas/v2/groups/${ATLAS_GROUP_ID}/accessList/${encodeURIComponent(
      cidrBlock
    )}"`);
    console.log(`Deleted ${cidrBlock}`);
  });
}
