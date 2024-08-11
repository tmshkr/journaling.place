#!/usr/bin/env node
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
} from "fs";
import { execSync } from "child_process";
import { resolve } from "path";

const workdir = process.cwd();
const buildContext = resolve("/host");
console.log(`Build context: ${buildContext}`);
const build = getTurboBuild(buildContext);
console.log(`Turbo build:`, build);

copyFile(buildContext, workdir, "package.json");
copyFile(buildContext, workdir, "package-lock.json");
for (const { directory } of build.tasks) {
  const srcDir = resolve(buildContext, directory);
  const destDir = resolve(workdir, directory);
  copyFile(srcDir, destDir, "package.json");
  copyFile(srcDir, destDir, "package-lock.json");
}

console.log(`Docker working directory: ${workdir}`);
readdirSync(workdir).forEach((file) => {
  console.log(file);
});

function copyFile(srcDir, destDir, file) {
  const sourceFile = resolve(srcDir, file);
  const destinationFile = resolve(destDir, file);
  if (!existsSync(sourceFile)) {
    return;
  }
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  try {
    copyFileSync(sourceFile, destinationFile);
    console.log(`Copied ${sourceFile} to ${destinationFile}`);
  } catch (err) {
    throw new Error(`Error copying file: ${err}`);
  }
}

function getTurboBuild(buildContext) {
  try {
    const version = JSON.parse(
      readFileSync(resolve(buildContext, "package.json"))
    ).dependencies.turbo;
    const turbo = `turbo@${version}`;
    execSync(`npx ${turbo} --version`, { stdio: "inherit" });
    return JSON.parse(
      execSync(`npx ${turbo} run build --cwd ${buildContext} --dry=json`)
    );
  } catch (err) {
    throw new Error(err.toString());
  }
}
