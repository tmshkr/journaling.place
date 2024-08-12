#!/usr/bin/env node

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";

const build = getTurboBuild();

const args = process.argv.slice(2);
for (const filepath of args) {
  updateDockerfile(filepath);
}

function updateDockerfile(dockerfilePath) {
  const instructions = [
    `COPY package.json package.json`,
    `COPY package-lock.json package-lock.json`,
  ];
  for (const { directory } of build.tasks) {
    instructions.push(
      `COPY ${directory}/package.json ${directory}/package.json`
    );
  }
  instructions.sort();

  const dockerfile = readFileSync(dockerfilePath, "utf8");
  writeFileSync(
    dockerfilePath,
    dockerfile.replace(
      /#START npm deps.*#END npm deps/s,
      `#START npm deps\n${instructions.join("\n")}\n#END npm deps`
    )
  );
}

function getTurboBuild() {
  try {
    const version = JSON.parse(readFileSync("package.json")).dependencies.turbo;
    const turbo = `turbo@${version}`;
    execSync(`npx ${turbo} --version`, { stdio: "inherit" });
    return JSON.parse(
      execSync(`npx ${turbo} run build --filter='./apps/*' --dry=json`)
    );
  } catch (err) {
    throw new Error(err.toString());
  }
}
