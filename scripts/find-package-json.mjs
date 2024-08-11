#!/usr/bin/env node

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";

const build = getTurboBuild();

const instructions = [];
for (const { directory } of build.tasks) {
  instructions.push(`COPY ${directory}/package.json ${directory}/package.json`);
}
instructions.sort();

const dockerfile = readFileSync("Dockerfile", "utf8");
writeFileSync(
  "Dockerfile",
  dockerfile.replace(
    /#START subdirs([\s\S])*#END subdirs/g,
    `#START subdirs\n${instructions.join("\n")}\n#END subdirs`
  )
);

function getTurboBuild() {
  try {
    const version = JSON.parse(readFileSync("package.json")).dependencies.turbo;
    const turbo = `turbo@${version}`;
    execSync(`npx ${turbo} --version`, { stdio: "inherit" });
    return JSON.parse(execSync(`npx ${turbo} run build --dry=json`));
  } catch (err) {
    throw new Error(err.toString());
  }
}
