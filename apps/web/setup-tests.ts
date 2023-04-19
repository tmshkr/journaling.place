import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function setup() {
  const testUser = { id: 0 };
  await prisma.user.upsert({
    where: testUser,
    create: testUser,
    update: testUser,
  });
  console.log("test environment setup complete");
}

setup();
