#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const option_settings = require("../option-settings.json");

option_settings.sort((a, b) => (a.Namespace < b.Namespace ? -1 : 1));

fs.writeFileSync(
  path.resolve(__dirname, "../option-settings.json"),
  JSON.stringify(option_settings, null, 2)
);
console.log("option-settings.json sorted");
