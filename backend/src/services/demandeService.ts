// backend/src/services/demandeService.ts
import { CanalNotification, ModeReception, PrismaClient, TypeCasier, TypeDocument } from '@prisma/client';
import { randomBytes } from 'crypto';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

interface DocumentInput {
  nom: string;
  typeDocument: string;
  buffer: Buffer;
  mimetype: string;
}

interface DemandeInput {
  typeCasier: string;
  modeReception: string;
  canalNotification: string;
  documents: DocumentInput[];
}

export const DemandeService = {
  async createDemande(userId: string, data: DemandeInput) {
    const suiviCode = randomBytes(8).toString('hex');

    const documentsData = data.documents.map((doc) => {
      const chemin = join(__dirname, '../../uploads', `${uuidv4()}-${doc.nom}`);
      writeFileSync(chemin, doc.buffer);
      return {
        nom: doc.nom,
        typeDocument: doc.typeDocument as TypeDocument,
        cheminFichier: chemin,
        formatFichier: doc.mimetype,
        tailleFichier: doc.buffer.length
      };
    });

    const demande = await prisma.demandeCasier.create({
      data: {
        typeCasier: data.typeCasier as TypeCasier,
        modeReception: data.modeReception as ModeReception,
        canalNotification: data.canalNotification as CanalNotification,
        statut: 'SOUMISE',
        suiviCode,
        estAnonyme: false,
        demandeur: {
          connect: { id: userId }
        },
        documents: {
          create: documentsData
        }
      }
    });

    return demande;
  },

  async getDemandesByUser(userId: string) {
    return prisma.demandeCasier.findMany({
      where: {
        demandeurId: userId
      },
      include: {
        documents: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  },

  async getUserStats(userId: string) {
    const total = await prisma.demandeCasier.count({ where: { demandeurId: userId } });
    const enCours = await prisma.demandeCasier.count({ where: { demandeurId: userId, statut: 'EN_COURS' } });
    const terminees = await prisma.demandeCasier.count({ where: { demandeurId: userId, statut: 'TERMINEE' } });
    const rejetees = await prisma.demandeCasier.count({ where: { demandeurId: userId, statut: 'REJETEE' } });

    return { total, enCours, terminees, rejetees };
  },

  async addDocuments(demandeId: string, userId: string, docs: DocumentInput[]) {
    const demande = await prisma.demandeCasier.findUnique({
      where: { id: demandeId },
      select: { demandeurId: true }
    });

    if (!demande || demande.demandeurId !== userId) {
      throw new Error('Accès non autorisé à cette demande');
    }

    const documentsData = docs.map((doc) => {
      const chemin = join(__dirname, '../../uploads', `${uuidv4()}-${doc.nom}`);
      writeFileSync(chemin, doc.buffer);
      return {
        nom: doc.nom,
        typeDocument: doc.typeDocument as TypeDocument,
        cheminFichier: chemin,
        formatFichier: doc.mimetype,
        tailleFichier: doc.buffer.length,
        demandeId
      };
    });

    return prisma.document.createMany({ data: documentsData });
  },

  async getDocument(documentId: string, userId: string) {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        demande: true
      }
    });

    if (!doc) {
      throw new Error('Document introuvable');
    }

    const demande = doc.demande;
    if (demande.demandeurId !== userId) {
      throw new Error('Accès non autorisé à ce document');
    }

    return doc;
  },

  async getDemandePourDemandeur(demandeId: string, userId: string) {
    const demande = await prisma.demandeCasier.findFirst({
      where: {
        id: demandeId,
        demandeurId: userId
      },
      include: {
        documents: {
          select: { id: true, nom: true, typeDocument: true, createdAt: true }
        }
      }
    });

    if (!demande) {
      throw new Error('Demande non trouvée ou non autorisée');
    }

    return demande;
  }
};
