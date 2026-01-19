/*
  Warnings:

  - A unique constraint covering the columns `[shortId]` on the table `quest` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "quest" ADD COLUMN     "acceptingResponses" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shortId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "quest_shortId_key" ON "quest"("shortId");
