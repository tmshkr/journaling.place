#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const option_settings = require("../option-settings.json");

option_settings.sort((a, b) => {
  if (a.Namespace < b.Namespace) {
    return -1;
  } else if (a.Namespace > b.Namespace) {
    return 1;
  } else {
    if (a.OptionName < b.OptionName) {
      return -1;
    } else if (a.OptionName > b.OptionName) {
      return 1;
    } else {
      return 0;
    }
  }
});

fs.writeFileSync(
  path.resolve(__dirname, "../option-settings.json"),
  JSON.stringify(option_settings, null, 2)
);
console.log("option-settings.json sorted");
