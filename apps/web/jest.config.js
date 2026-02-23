/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  moduleNameMapper: {
    "src/(.*)": ["<rootDir>/src/$1"],
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "/.next/"],
};

module.exports = config;
