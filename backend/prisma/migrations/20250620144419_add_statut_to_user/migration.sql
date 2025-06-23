/*
  Warnings:

  - You are about to drop the column `statut` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "statut",
ADD COLUMN     "status" "StatutUtilisateur" NOT NULL DEFAULT 'ACTIF';
