const { Index } = require("flexsearch");

export let index = new Index({
  preset: "default",
  tokenize: "full",
  resolution: 5,
});
