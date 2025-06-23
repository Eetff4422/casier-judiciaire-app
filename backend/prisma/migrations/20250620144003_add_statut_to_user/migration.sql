-- CreateEnum
CREATE TYPE "StatutUtilisateur" AS ENUM ('ACTIF', 'SUSPENDU');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "statut" "StatutUtilisateur" NOT NULL DEFAULT 'ACTIF';
