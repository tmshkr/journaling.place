#!/bin/env node

const { fs } = require("fs");
const { execSync } = require("child_process");
const { APP_VERSION, ENVIRONMENT, STAGING_CNAME, SHA, TAG } = process.env;

fs.writeFileSync(
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
