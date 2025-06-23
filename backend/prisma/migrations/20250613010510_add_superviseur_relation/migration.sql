-- AlterTable
ALTER TABLE "demandes_casier" ADD COLUMN     "superviseurId" TEXT;

-- AddForeignKey
ALTER TABLE "demandes_casier" ADD CONSTRAINT "demandes_casier_superviseurId_fkey" FOREIGN KEY ("superviseurId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
