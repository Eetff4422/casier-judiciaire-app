import { Request, Response, Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { MessageService } from '../services/messageService';

const router = Router();

// Toutes les routes de ce module nécessitent une authentification
router.use(authenticateToken);

// POST /messages - Envoyer un message
router.post('/', async (req: Request, res: Response) => {
  try {
    const fromId = req.user!.id;
    const { toId, contenu, demandeId } = req.body;

    if (!toId || !contenu || !demandeId) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    const message = await MessageService.envoyerMessage(fromId, toId, demandeId, contenu);
    res.status(201).json({ message: 'Message envoyé', data: message });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erreur lors de l’envoi du message' });
  }
});

// GET /messages/:demandeId - Obtenir tous les messages liés à une demande
router.get('/:demandeId', async (req: Request, res: Response) => {
  try {
    const { demandeId } = req.params;
    const userId = req.user!.id;

    const messages = await MessageService.getMessagesParDemande(demandeId, userId);
    res.json({ message: 'Messages récupérés', data: messages });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erreur lors de la récupération des messages' });
  }
});

// PUT /messages/:id/lu - Marquer un message comme lu
router.put('/:id/lu', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const updatedMessage = await MessageService.marquerCommeLu(id, userId);

    res.json({
      message: 'Message marqué comme lu',
      data: updatedMessage
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Erreur lors de la mise à jour du message'
    });
  }
});

export default router;
