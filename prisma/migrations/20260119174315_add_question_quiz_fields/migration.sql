-- AlterTable
ALTER TABLE "question" ADD COLUMN     "correctAnswer" JSONB,
ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0;
