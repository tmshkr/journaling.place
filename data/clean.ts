import prompts from "./prompts.json";
const fs = require("fs");
const path = require("path");

const originalLength = prompts.length;
const uniquePrompts = Object.values(
  prompts.reduce((acc, cur) => {
    cur.tags = cur.tags.map((tag) => tag.replaceAll(" ", "_"));
    acc[cur.prompt] = cur;
    return acc;
  }, {})
);

fs.writeFileSync(
  path.join(__dirname, "prompts.json"),
  JSON.stringify(uniquePrompts, null, 2)
);

console.log(`removed ${originalLength - uniquePrompts.length} duplicates`);
