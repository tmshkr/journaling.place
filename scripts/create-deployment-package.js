#!/bin/env node

const { writeFileSync } = require("fs");
const { execSync } = require("child_process");
const { APP_VERSION, ENVIRONMENT, STAGING_CNAME, SHA, TAG } = process.env;

writeFileSync(
  "env.json",
  JSON.stringify({
    APP_VERSION,
    ENVIRONMENT,
    STAGING_CNAME,
    SHA,
    TAG,
  })
);

execSync("zip -r bundle.zip . -x '*.git*'", { stdio: "inherit" });
