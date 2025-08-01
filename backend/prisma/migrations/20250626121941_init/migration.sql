-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DEMANDEUR', 'AGENT', 'SUPERVISEUR', 'ADMIN');

-- CreateEnum
CREATE TYPE "TypeCasier" AS ENUM ('B3');

-- CreateEnum
CREATE TYPE "StatutUtilisateur" AS ENUM ('ACTIF', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "StatutDemande" AS ENUM ('SOUMISE', 'EN_COURS', 'INFORMATIONS_MANQUANTES', 'EN_VALIDATION', 'REJETEE', 'TERMINEE');

-- CreateEnum
CREATE TYPE "ModeReception" AS ENUM ('EN_LIGNE', 'SUR_PLACE');

-- CreateEnum
CREATE TYPE "CanalNotification" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "TypeDocument" AS ENUM ('CNI', 'PASSEPORT', 'PHOTO_IDENTITE', 'JUSTIFICATIF', 'CASIER_GENERE');

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
    "statut" "StatutUtilisateur" NOT NULL DEFAULT 'ACTIF',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonymousDemande" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "documentUrl" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "suiviCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnonymousDemande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demandes_casier" (
    "id" TEXT NOT NULL,
    "typeCasier" "TypeCasier" NOT NULL,
    "statut" "StatutDemande" NOT NULL DEFAULT 'SOUMISE',
    "modeReception" "ModeReception" NOT NULL DEFAULT 'EN_LIGNE',
    "canalNotification" "CanalNotification" NOT NULL DEFAULT 'EMAIL',
    "motifRejet" TEXT,
    "demandeurId" TEXT,
    "agentId" TEXT,
    "superviseurId" TEXT,
    "estAnonyme" BOOLEAN NOT NULL DEFAULT false,
    "nomAnonyme" TEXT,
    "prenomAnonyme" TEXT,
    "emailAnonyme" TEXT,
    "telephoneAnonyme" TEXT,
    "suiviCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dateAttribution" TIMESTAMP(3),
    "dateTraitement" TIMESTAMP(3),
    "dateValidation" TIMESTAMP(3),
    "commentaire" TEXT,

    CONSTRAINT "demandes_casier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "demandeId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousDemande_suiviCode_key" ON "AnonymousDemande"("suiviCode");

-- CreateIndex
CREATE UNIQUE INDEX "demandes_casier_suiviCode_key" ON "demandes_casier"("suiviCode");

-- AddForeignKey
ALTER TABLE "demandes_casier" ADD CONSTRAINT "demandes_casier_demandeurId_fkey" FOREIGN KEY ("demandeurId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_casier" ADD CONSTRAINT "demandes_casier_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_casier" ADD CONSTRAINT "demandes_casier_superviseurId_fkey" FOREIGN KEY ("superviseurId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_toId_fkey" FOREIGN KEY ("toId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "demandes_casier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "demandes_casier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
