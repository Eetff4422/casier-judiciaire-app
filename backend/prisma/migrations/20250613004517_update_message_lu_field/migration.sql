/*
  Warnings:

  - The values [REJETEE_SUPERVISEUR,VALIDE] on the enum `StatutDemande` will be removed. If these variants are still used in the database, this will fail.
  - The values [B1,B2] on the enum `TypeCasier` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StatutDemande_new" AS ENUM ('SOUMISE', 'EN_COURS', 'INFORMATIONS_MANQUANTES', 'EN_VALIDATION', 'REJETEE', 'TERMINEE');
ALTER TABLE "demandes_casier" ALTER COLUMN "statut" DROP DEFAULT;
ALTER TABLE "demandes_casier" ALTER COLUMN "statut" TYPE "StatutDemande_new" USING ("statut"::text::"StatutDemande_new");
ALTER TYPE "StatutDemande" RENAME TO "StatutDemande_old";
ALTER TYPE "StatutDemande_new" RENAME TO "StatutDemande";
DROP TYPE "StatutDemande_old";
ALTER TABLE "demandes_casier" ALTER COLUMN "statut" SET DEFAULT 'SOUMISE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TypeCasier_new" AS ENUM ('B3');
ALTER TABLE "demandes_casier" ALTER COLUMN "typeCasier" TYPE "TypeCasier_new" USING ("typeCasier"::text::"TypeCasier_new");
ALTER TYPE "TypeCasier" RENAME TO "TypeCasier_old";
ALTER TYPE "TypeCasier_new" RENAME TO "TypeCasier";
DROP TYPE "TypeCasier_old";
COMMIT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "lu" BOOLEAN NOT NULL DEFAULT false;
