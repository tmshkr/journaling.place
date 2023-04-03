/*
  Warnings:

  - A unique constraint covering the columns `[id,authorId]` on the table `Journal` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Journal" DROP CONSTRAINT "Journal_promptId_fkey";

-- DropIndex
DROP INDEX "Journal_authorId_promptId_key";

-- AlterTable
ALTER TABLE "Journal" ALTER COLUMN "promptId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Journal_authorId_idx" ON "Journal"("authorId");

-- CreateIndex
CREATE INDEX "Journal_promptId_idx" ON "Journal"("promptId");

-- CreateIndex
CREATE UNIQUE INDEX "Journal_id_authorId_key" ON "Journal"("id", "authorId");

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
