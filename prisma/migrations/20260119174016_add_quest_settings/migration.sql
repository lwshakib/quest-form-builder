-- AlterTable
ALTER TABLE "quest" ADD COLUMN     "confirmationMessage" TEXT DEFAULT 'Your response has been recorded.',
ADD COLUMN     "isQuiz" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "limitToOneResponse" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "questionsRequiredByDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showLinkToSubmitAnother" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showProgressBar" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "shuffleQuestionOrder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "viewResultsSummary" BOOLEAN NOT NULL DEFAULT false;
