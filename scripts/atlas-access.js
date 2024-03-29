#!/usr/bin/env node
require("dotenv").config();
const { execSync } = require("child_process");

const { ATLAS_PUBLIC_KEY, ATLAS_PRIVATE_KEY, ATLAS_GROUP_ID } = process.env;

const op = process.argv[2];

switch (op) {
  case "open":
    addEntry();
    break;
  case "restrict":
    restrictAccess();
    break;
  default:
    describeAccessList();
}

function addEntry(cidrBlock) {
  const res = execSync(`
  curl -s \
  --user "${ATLAS_PUBLIC_KEY}:${ATLAS_PRIVATE_KEY}" --digest \
  --header "Content-Type: application/json" \
  --header "Accept: application/vnd.atlas.2023-02-01+json" \
  --request POST "https://cloud.mongodb.com/api/atlas/v2/groups/${ATLAS_GROUP_ID}/accessList" \
  --data '${JSON.stringify([
    cidrBlock
      ? { cidrBlock }
      : {
          cidrBlock: "0.0.0.0/0",
          deleteAfterDate: new Date(Date.now() + 1000 * 60 * 60),
        },
  ])}'`);
  console.log(JSON.parse(res.toString()));
  console.log(`Added ${cidrBlock || "0.0.0.0/0"}`);
}

function describeAccessList() {
  const { results } = JSON.parse(
    execSync(`
    curl -s \
    --user "${ATLAS_PUBLIC_KEY}:${ATLAS_PRIVATE_KEY}" --digest \
    --header "Content-Type: application/json" \
    --header "Accept: application/vnd.atlas.2023-02-01+json" \
    --request GET "https://cloud.mongodb.com/api/atlas/v2/groups/${ATLAS_GROUP_ID}/accessList"`)
  );

  console.log(results);
}

function restrictAccess() {
  const myIP = execSync("curl -s https://checkip.amazonaws.com")
    .toString()
    .trim();
  const allowed = new Set([`${myIP}/32`]);

  const { Environments } = JSON.parse(
    execSync(
      "aws elasticbeanstalk describe-environments --application-name journaling.place --no-include-deleted"
    )
  );
  Environments.forEach((env) => {
    if (env.Health === "Grey") return;
    if (env.EndpointURL.includes("elb.amazonaws.com")) {
      // load-balanced env
      const instanceIds = JSON.parse(
        execSync(
          `aws elasticbeanstalk describe-environment-resources --environment-id ${env.EnvironmentId}`
        )
      )
        .EnvironmentResources.Instances.map(({ Id }) => Id)
        .join(" ");

      const { Instances } = JSON.parse(
        execSync(`aws ec2 describe-instances --instance-ids ${instanceIds}`)
      ).Reservations[0];

      for (const { PublicIpAddress } of Instances) {
        allowed.add(`${PublicIpAddress}/32`);
      }
    } else {
      allowed.add(`${env.EndpointURL}/32`);
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

  const accessList = new Set(results.map((entry) => entry.cidrBlock));

  allowed.forEach((cidrBlock) => {
    if (!accessList.has(cidrBlock)) {
      addEntry(cidrBlock);
    }
  });

  const toDelete = [];
  accessList.forEach((cidrBlock) => {
    if (!allowed.has(cidrBlock)) {
      toDelete.push(cidrBlock);
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
