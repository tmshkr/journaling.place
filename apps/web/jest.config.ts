import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  moduleNameMapper: {
    "src/(.*)": ["<rootDir>/src/$1"],
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "/.next/"],
};

export default config;
