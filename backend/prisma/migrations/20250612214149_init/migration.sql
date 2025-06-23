/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TypeCasier" AS ENUM ('B1', 'B2', 'B3');

-- CreateEnum
CREATE TYPE "StatutDemande" AS ENUM ('SOUMISE', 'EN_COURS', 'INFORMATIONS_MANQUANTES', 'EN_VALIDATION', 'TERMINEE', 'REJETEE');

-- CreateEnum
CREATE TYPE "ModeReception" AS ENUM ('EN_LIGNE', 'SUR_PLACE');

-- CreateEnum
CREATE TYPE "CanalNotification" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "TypeDocument" AS ENUM ('CNI', 'PASSEPORT', 'PHOTO_IDENTITE', 'JUSTIFICATIF', 'CASIER_GENERE');

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "securityQuestion" TEXT NOT NULL,
    "securityAnswer" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demandes_casier" (
    "id" TEXT NOT NULL,
    "typeCasier" "TypeCasier" NOT NULL,
    "statut" "StatutDemande" NOT NULL DEFAULT 'SOUMISE',
    "modeReception" "ModeReception" NOT NULL DEFAULT 'EN_LIGNE',
    "canalNotification" "CanalNotification" NOT NULL DEFAULT 'EMAIL',
    "motifRejet" TEXT,
    "demandeurId" TEXT NOT NULL,
    "agentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dateAttribution" TIMESTAMP(3),
    "dateTraitement" TIMESTAMP(3),
    "dateValidation" TIMESTAMP(3),

    CONSTRAINT "demandes_casier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "typeDocument" "TypeDocument" NOT NULL,
    "cheminFichier" TEXT NOT NULL,
    "tailleFichier" INTEGER NOT NULL,
    "formatFichier" TEXT NOT NULL,
    "demandeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "demandes_casier" ADD CONSTRAINT "demandes_casier_demandeurId_fkey" FOREIGN KEY ("demandeurId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_casier" ADD CONSTRAINT "demandes_casier_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "demandes_casier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
