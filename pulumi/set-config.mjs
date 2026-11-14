#!/usr/bin/env node
// Copies deployment settings into `pulumi config` for one stack.
//
// Reads ./.env by default. The variable names are the ones k8s/app/deploy.sh
// required, so the GitHub workflow passes the same environment and runs this
// with --from-env.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { parseArgs, parseEnv } from "node:util";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Variable name -> Pulumi config key. `secret: true` routes the value through
 * stdin rather than argv so it never appears in the process list; `file: true`
 * means the variable holds a path and the file's contents get stored.
 */
const MAPPING = [
  // --- cluster ---
  // KUBECONFIG keeps its usual meaning: a path. The contents get stored. Leave
  // it unset to deploy with whatever kubeconfig is ambient, as CI does.
  { env: "KUBECONFIG", key: "jp:kubeconfig", secret: true, file: true },
  { env: "KUBE_CONTEXT", key: "jp:kubeContext" },
  { env: "K8S_NAMESPACE", key: "jp:namespace" },
  { env: "CREATE_NAMESPACE", key: "jp:createNamespace" },

  // --- release ---
  { env: "IMAGE_REPOSITORY", key: "jp:imageRepository" },
  { env: "VERSION_LABEL", key: "jp:versionLabel" },
  { env: "REPLICAS", key: "jp:replicas" },

  // --- routing ---
  { env: "TARGET_DOMAIN", key: "jp:domain" },
  { env: "INGRESS_ENABLED", key: "jp:ingressEnabled" },
  { env: "INGRESS_CLASS_NAME", key: "jp:ingressClassName" },

  // --- app ---
  { env: "NEXTAUTH_URL", key: "jp:nextauthUrl" },
  { env: "NEXTAUTH_SECRET", key: "jp:nextauthSecret", secret: true },
  { env: "MONGO_URI", key: "jp:mongoUri", secret: true },
  { env: "EMAIL_FROM", key: "jp:emailFrom" },
  { env: "EMAIL_SECRET", key: "jp:emailSecret", secret: true },
  { env: "EMAIL_SERVER", key: "jp:emailServer", secret: true },
  { env: "TEST_USER_EMAIL", key: "jp:testUserEmail" },
  { env: "PRISMA_QUERY_ENGINE_LIBRARY", key: "jp:prismaQueryEngineLibrary" },
];

const { values } = parseArgs({
  options: {
    stack: { type: "string", short: "s" },
    "env-file": { type: "string", multiple: true },
    "from-env": { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

if (values.help) {
  console.log(`Usage: node set-config.mjs [options]

  -s, --stack <name>    Target stack (defaults to the selected one)
      --env-file <path> .env file to read; repeatable, later files win.
                        Defaults to ./.env
      --from-env        Read the process environment instead of .env files (CI)
      --dry-run         Print what would be set, without touching the stack
  -h, --help            Show this message

Recognised variables:
${MAPPING.map((m) => `  ${m.env.padEnd(28)} -> ${m.key.padEnd(28)}${m.secret ? " (secret)" : ""}`).join("\n")}`);
  process.exit(0);
}

let env = {};
let source;
if (values["from-env"]) {
  env = process.env;
  source = "the environment";
} else {
  const envFiles = values["env-file"]?.length ? values["env-file"] : [path.join(here, ".env")];
  const loaded = [];
  for (const file of envFiles) {
    let contents;
    try {
      contents = readFileSync(file, "utf8");
    } catch (err) {
      console.error(`Cannot read ${file}: ${err.message}`);
      process.exit(1);
    }
    Object.assign(env, parseEnv(contents));
    loaded.push(path.relative(process.cwd(), file) || file);
  }
  source = loaded.join(", ");
}

const resolved = [];
for (const entry of MAPPING) {
  const raw = env[entry.env]?.trim();
  if (!raw) continue;

  let value = raw;
  if (entry.file) {
    // No shell runs over .env files, so `~` has to be expanded by hand.
    const expanded = raw.startsWith("~/") ? path.join(homedir(), raw.slice(2)) : raw;
    try {
      value = readFileSync(path.resolve(here, expanded), "utf8");
    } catch (err) {
      console.error(`${entry.env} should be a path to a readable file: ${err.message}`);
      process.exit(1);
    }
  }
  resolved.push({ ...entry, value });
}

if (!resolved.length) {
  console.error(`No recognised variables in ${source}. Run with --help for the list.`);
  process.exit(1);
}

const stackArgs = values.stack ? ["--stack", values.stack] : [];
console.log(`Read ${source}`);
console.log(
  resolved
    .map((e) => `  ${e.key} = ${e.secret ? "<secret>" : e.value}${e.file ? ` (from ${env[e.env]})` : ""}`)
    .join("\n"),
);

if (values["dry-run"]) {
  console.log("\nDry run — nothing was set.");
  process.exit(0);
}

const pulumi = (args, input) =>
  execFileSync("pulumi", args, {
    cwd: here,
    input,
    stdio: input === undefined ? ["ignore", "inherit", "inherit"] : ["pipe", "inherit", "inherit"],
  });

const plaintext = resolved.filter((e) => !e.secret);
const secrets = resolved.filter((e) => e.secret);

try {
  // One call for everything unencrypted; `set-all` is far quicker than N sets.
  if (plaintext.length) {
    pulumi([
      "config",
      "set-all",
      ...stackArgs,
      ...plaintext.flatMap((e) => ["--plaintext", `${e.key}=${e.value}`]),
    ]);
  }
  // Secrets go one at a time over stdin, which also handles the multi-line
  // kubeconfig without any quoting games.
  for (const e of secrets) {
    pulumi(["config", "set", "--secret", ...stackArgs, e.key], e.value);
  }
} catch (err) {
  console.error(`\npulumi exited with status ${err.status ?? 1}.`);
  process.exit(err.status ?? 1);
}

console.log(`\nSet ${resolved.length} value(s).`);
