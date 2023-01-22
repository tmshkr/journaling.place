const prompts = require("./prompts.json");
const fs = require("fs");
const path = require("path");

const originalLength = prompts.length;
const uniquePrompts = Object.values(
  prompts.reduce((acc: any, cur: any) => {
    cur.tags = cur.tags.map((tag: string) => tag.replace(/\s/g, "_"));
    if (acc[cur.prompt]) {
      delete acc[cur.prompt];
    }
    acc[cur.prompt] = cur;
    return acc;
  }, {})
);

fs.writeFileSync(
  path.join(__dirname, "prompts.json"),
  JSON.stringify(uniquePrompts, null, 2)
);

console.log(`removed ${originalLength - uniquePrompts.length} duplicates`);
