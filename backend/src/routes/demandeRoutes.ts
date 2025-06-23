// backend/src/routes/demandeRoutes.ts
import { PrismaClient } from '@prisma/client';
import { Request, Response, Router } from 'express';
import multer from 'multer';
import { authenticateToken, requireDemandeur } from '../middleware/authMiddleware';
import { DemandeService } from '../services/demandeService';

const prisma = new PrismaClient();
const router = Router();

// Configuration multer pour upload de fichiers
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 10 // 10 fichiers max
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
router.post('/', authenticateToken, requireDemandeur, upload.array('documents'), async (req: Request, res: Response) => {
  try {
    const { typeCasier, modeReception, canalNotification } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!typeCasier || !modeReception || !canalNotification) {
      return res.status(400).json({ error: 'Type de casier, mode de réception et canal de notification requis' });
    }
    if (!['B1', 'B2', 'B3'].includes(typeCasier)) {
      return res.status(400).json({ error: 'Type de casier invalide' });
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

    const demande = await DemandeService.createDemande(req.user!.userId, {
      typeCasier,
      modeReception,
      canalNotification,
      documents
    });

    res.status(201).json({ message: 'Demande créée avec succès', demande });
  } catch (error: any) {
    console.error('Erreur création demande:', error);
    res.status(400).json({ error: error.message || 'Erreur lors de la création de la demande' });
  }
});

// GET /api/demandes - Obtenir les demandes de l'utilisateur connecté
router.get('/', authenticateToken, requireDemandeur, async (req: Request, res: Response) => {
  try {
    const demandes = await DemandeService.getDemandesByUser(req.user!.userId);
    res.json({ demandes });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erreur lors de la récupération des demandes' });
  }
});

// GET /api/demandes/assigned - Obtenir les demandes assignées à l'agent connecté
router.get('/assigned', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'AGENT') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const demandes = await prisma.demandeCasier.findMany({
      where: { agentId: req.user.userId },
      include: {
        demandeur: { select: { fullName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ demandes });
  } catch (error: any) {
    console.error('Erreur récupération demandes assignées:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
// PATCH /api/demandes/:id/statut - Mettre à jour le statut d'une demande
router.patch('/:id/statut', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { statut, commentaire } = req.body;

    const allowedStatuts = ['TERMINEE', 'REJETEE', 'INFORMATIONS_MANQUANTES'];
    if (!allowedStatuts.includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const data: any = {
      statut,
      updatedAt: new Date()
    };

    // Ajout conditionnel du commentaire si présent
    if (commentaire && commentaire.trim().length > 0) {
      data.commentaire = commentaire.trim();
    }

    const demande = await prisma.demandeCasier.update({
      where: { id },
      data
    });

    if (!demande) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    res.json({ message: 'Statut mis à jour', demande });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});
router.patch('/:id/validation', authenticateToken, async (req, res) => {
  const { id } = req.params;

  if (req.user?.role !== 'SUPERVISEUR' && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  try {
    const updated = await prisma.demandeCasier.update({
      where: { id },
      data: {
        statut: 'TERMINEE',
        updatedAt: new Date(),
      },
    });

    res.json({ message: 'Demande validée', demande: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erreur lors de la validation' });
  }
});
router.patch('/:id/rejet', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { commentaire } = req.body;

  if (req.user?.role !== 'SUPERVISEUR' && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  try {
    const updated = await prisma.demandeCasier.update({
      where: { id },
      data: {
        statut: 'REJETEE',
        commentaire,
        updatedAt: new Date(),
      },
    });

    res.json({ message: 'Demande rejetée', demande: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erreur lors du rejet' });
  }
});

// GET /api/demandes/:id - Obtenir une demande spécifique
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const demandeurId = req.user!.role === 'DEMANDEUR' ? req.user!.userId : undefined;
    const demande = await DemandeService.getDemandeById(id, demandeurId);

    if (!demande) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    res.json({ demande });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erreur lors de la récupération de la demande' });
  }
});



// POST /api/demandes/:id/documents - Ajouter des documents complémentaires
router.post('/:id/documents', authenticateToken, requireDemandeur, upload.array('documents'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Au moins un document est requis' });
    }

    const documents = files.map(file => ({
      nom: file.originalname,
      typeDocument: req.body[`typeDocument_${file.originalname}`] || 'JUSTIFICATIF',
      buffer: file.buffer,
      mimetype: file.mimetype
    }));

    const documentsCreated = await DemandeService.addDocuments(id, req.user!.userId, documents);
    res.json({ message: 'Documents ajoutés avec succès', documents: documentsCreated });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erreur lors de l\'ajout des documents' });
  }
});

// GET /api/demandes/:demandeId/documents/:documentId - Télécharger un document
router.get('/:demandeId/documents/:documentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const document = await DemandeService.getDocument(documentId, req.user!.userId);

    const fs = require('fs');
    if (!fs.existsSync(document.cheminFichier)) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    res.setHeader('Content-Type', document.formatFichier);
    res.setHeader('Content-Disposition', `inline; filename="${document.nom}"`);
    const fileStream = fs.createReadStream(document.cheminFichier);
    fileStream.pipe(res);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erreur lors du téléchargement du document' });
  }
});

// GET /api/demandes/user/stats - Statistiques des demandes de l'utilisateur
router.get('/user/stats', authenticateToken, requireDemandeur, async (req: Request, res: Response) => {
  try {
    const stats = await DemandeService.getUserStats(req.user!.userId);
    res.json({ stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erreur lors de la récupération des statistiques' });
  }
});

export default router;
