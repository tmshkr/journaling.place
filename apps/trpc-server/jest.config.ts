import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};

export default config;
