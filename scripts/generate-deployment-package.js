const { BRANCH } = process.env;
const { execSync } = require("child_process");

const environment = BRANCH === "main" ? "production" : "staging";
execSync(
  `echo ${environment} > ENVIRONMENT && zip -r deploy.zip . -x '*.git*'`
);
