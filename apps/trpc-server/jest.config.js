/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  setupFilesAfterEnv: ["common/prisma/mock.ts"],
};

module.exports = config;
