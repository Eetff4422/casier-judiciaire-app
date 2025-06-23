// backend/src/services/demandeService.ts
import { CanalNotification, ModeReception, PrismaClient, TypeCasier, TypeDocument } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AssignmentService } from '../services/assignmentService';

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class DemandeService {
  static async createDemande(
  demandeurId: string,
  {
    typeCasier,
    modeReception,
    canalNotification,
    documents
  }: {
    typeCasier: 'B3';
    modeReception: string;
    canalNotification: string;
    documents: {
      nom: string;
      typeDocument: string;
      buffer: Buffer;
      mimetype: string;
    }[];
  }
) {
  const demande = await prisma.demandeCasier.create({
    data: {
      demandeurId,
      typeCasier: typeCasier as TypeCasier,
      modeReception: modeReception as ModeReception,
      canalNotification: canalNotification as CanalNotification,
      statut: 'SOUMISE'
    }
  });

  for (const doc of documents) {
    const fileName = `${uuidv4()}-${doc.nom}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    fs.writeFileSync(filePath, doc.buffer);

    await prisma.document.create({
      data: {
        nom: doc.nom,
        typeDocument: doc.typeDocument as TypeDocument,
        formatFichier: doc.mimetype,
        cheminFichier: filePath,
        tailleFichier: doc.buffer.length,
        demandeId: demande.id
      }
    });
  }

  //Appel de l’attribution automatique
  try {
    await AssignmentService.assignDemandToAgent(demande.id);
  } catch (err) {
    console.error(`Erreur d’attribution automatique pour la demande ${demande.id}:`, err);
  }

  return demande;
}

  static async getDemandesByUser(demandeurId: string) {
    return await prisma.demandeCasier.findMany({
      where: { demandeurId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getDemandeById(id: string, demandeurId?: string) {
    return await prisma.demandeCasier.findFirst({
      where: {
        id,
        ...(demandeurId && { demandeurId })
      },
      include: { documents: true }
    });
  }

  static async addDocuments(
    demandeId: string,
    demandeurId: string,
    documents: {
      nom: string;
      typeDocument: string;
      buffer: Buffer;
      mimetype: string;
    }[]
  ) {
    const demande = await prisma.demandeCasier.findFirst({
      where: { id: demandeId, demandeurId }
    });

    if (!demande) throw new Error('Demande introuvable');

    const createdDocs = [];

    for (const doc of documents) {
      const fileName = `${uuidv4()}-${doc.nom}`;
      const filePath = path.join(UPLOAD_DIR, fileName);

      fs.writeFileSync(filePath, doc.buffer);

      const created = await prisma.document.create({
        data: {
          nom: doc.nom,
          typeDocument: doc.typeDocument as TypeDocument,
          formatFichier: doc.mimetype,
          cheminFichier: filePath,
          tailleFichier: doc.buffer.length,
          demandeId: demande.id
        }
      });

      createdDocs.push(created);
    }

    return createdDocs;
  }

  static async getDocument(documentId: string, userId: string) {
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        demande: {
          demandeurId: userId
        }
      }
    });

    if (!document) throw new Error('Document non trouvé');

    return document;
  }

  static async getUserStats(demandeurId: string) {
    const total = await prisma.demandeCasier.count({ where: { demandeurId } });
    const enCours = await prisma.demandeCasier.count({ where: { demandeurId, statut: 'EN_COURS' } });
    const traitées = await prisma.demandeCasier.count({ where: { demandeurId, statut: 'TERMINEE' } });

    return {
      total,
      enCours,
      traitées
    };
  }
  static async updateStatut(demandeId: string, statut: 'TERMINEE' | 'REJETEE' | 'INFORMATIONS_MANQUANTES') {
  return await prisma.demandeCasier.update({
    where: { id: demandeId },
    data: {
      statut,
      ...(statut === 'TERMINEE' && { dateTraitement: new Date() })
    }
  });
}

}
