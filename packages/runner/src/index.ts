import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();
const prompts = require("../data/prompts.json");

import { seed } from "./seed";
const op = process.argv[2];

switch (op) {
  case "seed":
    seed(prompts)
      .then(async () => {
        await prisma.$disconnect();
      })
      .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
      });

    break;
  default:
    console.log("Invalid operation");
}
