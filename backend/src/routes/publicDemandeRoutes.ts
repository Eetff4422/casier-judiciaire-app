// backend/routes/publicDemandeRoutes.ts
import express from 'express';
import multer from 'multer';
import { createPublicDemande, getPublicDemandeByCode } from '../services/publicDemandeService';

const router = express.Router();

// Configuration multer
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

// POST /api/public - Créer une demande anonyme
router.post('/', upload.array('documents'), async (req, res) => {
  try {
    const { nom, prenom, email, telephone, typeCasier, modeReception, canalNotification } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!nom || !prenom || !email || !telephone || !typeCasier || !modeReception || !canalNotification) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'Au moins un document est requis' });
    }

    const fichiers = files.map(file => ({
      nom: file.originalname,
      mimetype: file.mimetype,
      buffer: file.buffer,
      typeDocument: req.body[`typeDocument_${file.originalname}`] || 'JUSTIFICATIF'
    }));

    try {
  const demande = await createPublicDemande(nom, prenom, email, telephone, typeCasier, modeReception, canalNotification, fichiers);
  res.status(201).json({ message: 'Demande enregistrée avec succès', suiviLink: `/public/suivi/${demande.suiviCode}` });
} catch (err: any) {
  if (err.message === 'Tous les agents sont à pleine capacité') {
    return res.status(503).json({ message: 'Aucun agent disponible pour le moment. Réessayez plus tard.' });
  }
  throw err; // relancer les autres erreurs
}

  } catch (err: any) {
    console.error('Erreur création demande anonyme:', err);
    res.status(500).json({ message: 'Erreur lors de la création de la demande', error: err.message });
  }
});

// GET /api/public/suivi/:code - Suivi d'une demande
router.get('/suivi/:code', async (req, res) => {
  const demande = await getPublicDemandeByCode(req.params.code);
  if (!demande) return res.status(404).json({ message: 'Demande introuvable' });
  res.json(demande);
});

export default router;
