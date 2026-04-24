/*
  Warnings:

  - You are about to drop the column `tokenEnvVar` on the `companies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "companies" DROP COLUMN "tokenEnvVar",
ALTER COLUMN "smCompanyId" SET DEFAULT '',
ALTER COLUMN "timezone" SET DEFAULT 'America/Toronto';
