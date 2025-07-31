import { CanalNotification, ModeReception, PrismaClient, TypeCasier, TypeDocument } from '@prisma/client';
import crypto from 'crypto';
import { sendMail } from '../utils/mailer';
import { sendSMS } from '../utils/smsSender';
import { assignAgentAutomatically } from './assignmentService';

const prisma = new PrismaClient();

export const createPublicDemande = async (
  nom: string,
  prenom: string,
  email: string,
  telephone: string,
  typeCasier: string,
  modeReception: string,
  canalNotification: string,
  fichiers?: {
    nom: string;
    mimetype: string;
    buffer: Buffer;
    typeDocument?: string;
  }[]
) => {
  const suiviCode = crypto.randomBytes(10).toString('hex');
  const agentId = await assignAgentAutomatically();

  const demande = await prisma.demandeCasier.create({
    data: {
      typeCasier: typeCasier as TypeCasier,
      statut: 'EN_COURS',
      modeReception: modeReception as ModeReception,
      canalNotification: canalNotification as CanalNotification,
      estAnonyme: true,
      nomAnonyme: nom,
      prenomAnonyme: prenom,
      emailAnonyme: email,
      telephoneAnonyme: telephone,
      suiviCode,
      agent: { connect: { id: agentId } },
      documents: fichiers
        ? {
            create: fichiers.map(file => ({
              nom: file.nom,
              formatFichier: file.mimetype,
              typeDocument: (file.typeDocument as TypeDocument) || 'JUSTIFICATIF',
              tailleFichier: file.buffer.length,
              cheminFichier: '', // Remplir si tu utilises le système de fichiers
            })),
          }
        : undefined,
    },
  });

  const suiviLink = `${process.env.FRONTEND_URL}/suivi-demande/${suiviCode}`;

  try {
    await sendMail(email, 'Suivi de votre demande', `Voici votre lien de suivi : ${suiviLink}`);
  } catch (err) {
    console.error('Erreur envoi mail :', err);
  }

  try {
    await sendSMS(telephone, `Lien de suivi casier : ${suiviLink}`);
  } catch (err) {
    console.error('Erreur envoi SMS :', err);
  }

  return { suiviCode };
};

export const getPublicDemandeByCode = async (code: string) => {
  return await prisma.demandeCasier.findUnique({
    where: { suiviCode: code },
    include: {
      documents: true,
    },
  });
};
