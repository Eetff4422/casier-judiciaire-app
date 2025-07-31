import { PrismaClient } from '@prisma/client';
import { Request, Response, Router } from 'express';
import multer from 'multer';
import {
  authenticateToken,
  requireAgent,
  requireDemandeur
} from '../middleware/authMiddleware';
import { AgentService } from '../services/agentService';
import { AssignmentService } from '../services/assignmentService';
import { DemandeService } from '../services/demandeService';

const prisma = new PrismaClient();
const router = Router();

// Configuration multer pour upload de fichiers
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé. Seuls JPG, PNG et PDF sont acceptés.'));
    }
  }
});

// POST /api/demandes - Créer une nouvelle demande
router.post(
  '/',
  authenticateToken,
  requireDemandeur,
  upload.array('documents'),
  async (req: Request, res: Response) => {
    try {
      const { typeCasier, modeReception, canalNotification } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!typeCasier || !modeReception || !canalNotification) {
        return res.status(400).json({ error: 'Type de casier, mode de réception et canal de notification requis' });
      }

      if (typeCasier !== 'B3') {
        return res.status(400).json({ error: 'Seul le casier B3 est actuellement disponible' });
      }

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'Au moins un document est requis' });
      }

      const documents = files.map(file => ({
        nom: file.originalname,
        typeDocument: req.body[`typeDocument_${file.originalname}`] || 'JUSTIFICATIF',
        buffer: file.buffer,
        mimetype: file.mimetype
      }));

      const demande = await DemandeService.createDemande(req.user!.id, {
        typeCasier,
        modeReception,
        canalNotification,
        documents
      });

      await AssignmentService.assignDemandToAgent(demande.id);

      res.status(201).json({ message: 'Demande créée et attribuée avec succès', demande });
    } catch (error: any) {
      console.error('Erreur création demande:', error);
      res.status(400).json({ error: error.message || 'Erreur lors de la création de la demande' });
    }
  }
);

// GET /api/demandes - Liste des demandes du demandeur connecté
router.get(
  '/',
  authenticateToken,
  requireDemandeur,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      const demandes = await prisma.demandeCasier.findMany({
        where: { demandeurId: userId },
        include: {
          documents: {
            select: {
              id: true,
              nom: true,
              typeDocument: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ demandes });
    } catch (error: any) {
      console.error('Erreur récupération demandes demandeur:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

// GET /api/demandes/assigned - Liste des demandes assignées à un agent
router.get(
  '/assigned',
  authenticateToken,
  requireAgent,
  async (req: Request, res: Response) => {
    try {
      const agentId = req.user!.id;
      const demandes = await AgentService.getAssignedDemandes(agentId);
      res.json(demandes);
    } catch (error: any) {
      console.error('Erreur récupération des demandes assignées:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

// GET /api/demandes/:id - Obtenir une demande spécifique selon le rôle
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id: demandeId } = req.params;
    const { id: userId, role } = req.user!;

    if (role === 'DEMANDEUR') {
      const demande = await prisma.demandeCasier.findUnique({
        where: { id: demandeId },
        include: { documents: true }
      });

      if (!demande || demande.demandeurId !== userId) {
        return res.status(403).json({ error: 'Accès non autorisé à cette demande' });
      }

      return res.json({ demande });
    }

    if (role === 'AGENT') {
      const demande = await AgentService.getDemandeDetails(demandeId, userId);
      if (!demande) {
        return res.status(404).json({ error: 'Demande non trouvée ou non assignée à cet agent' });
      }
      return res.json({ demande });
    }

    if (role === 'ADMIN') {
      const demande = await prisma.demandeCasier.findUnique({
        where: { id: demandeId },
        include: { documents: true }
      });
      return res.json({ demande });
    }

    if (role === 'SUPERVISEUR') {
      const demande = await prisma.demandeCasier.findUnique({
        where: { id: demandeId },
        include: { documents: true }
      });

      if (!demande) return res.status(404).json({ error: 'Demande non trouvée' });

      const statutsAutorises = ['TERMINEE', 'REJETEE'];
      if (statutsAutorises.includes(demande.statut)) {
        return res.json({ demande });
      } else {
        return res.status(403).json({ error: 'Le superviseur ne peut voir que les demandes terminées ou rejetées' });
      }
    }

    return res.status(403).json({ error: 'Rôle non autorisé' });
  } catch (error: any) {
    console.error('Erreur récupération demande:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// PATCH /api/demandes/:id/statut - Traiter une demande (par un agent)
router.patch('/:id/statut', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id: demandeId } = req.params;
    const { id: agentId, role } = req.user!;
    const traitement = req.body;

    if (role !== 'AGENT') {
      return res.status(403).json({ error: 'Seuls les agents peuvent traiter les demandes' });
    }

    const result = await AgentService.traiterDemandeMixte(agentId, demandeId, traitement);

    res.json(result);
  } catch (error: any) {
    console.error('Erreur traitement demande:', error);
    res.status(400).json({ error: error.message || 'Erreur lors du traitement de la demande' });
  }
});

// POST /api/demandes/:id/documents - Compléter une demande existante (demandeur)
router.post(
  '/:id/documents',
  authenticateToken,
  requireDemandeur,
  upload.array('documents'),
  async (req: Request, res: Response) => {
    try {
      const demandeId = req.params.id;
      const userId = req.user!.id;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'Aucun fichier reçu' });
      }

      const documents = files.map(file => ({
        nom: file.originalname,
        typeDocument: req.body[`typeDocument_${file.originalname}`] || 'JUSTIFICATIF',
        buffer: file.buffer,
        mimetype: file.mimetype
      }));

      await DemandeService.addDocuments(demandeId, userId, documents);

      res.status(200).json({ message: 'Documents ajoutés avec succès' });
    } catch (error: any) {
      console.error('Erreur ajout documents à la demande:', error);
      res.status(400).json({ error: error.message || 'Erreur lors de l\'ajout des documents' });
    }
  }
);

export default router;
