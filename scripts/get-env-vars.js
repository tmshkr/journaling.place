const { BRANCH, CONFIG_S3_BUCKET } = process.env;
const { execSync } = require("child_process");

const environment = BRANCH === "main" ? "production" : "staging";
execSync(`aws s3 cp s3://${CONFIG_S3_BUCKET}/${environment}.env .env`);
