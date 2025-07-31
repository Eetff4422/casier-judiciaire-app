// backend/src/routes/agentRoutes.ts
import { Request, Response, Router } from 'express';
import { authenticateToken, requireAgent } from '../middleware/authMiddleware';
import { AgentService } from '../services/agentService';

const router = Router();

// Toutes les routes nécessitent d'être un agent
router.use(authenticateToken, requireAgent);

// GET /agent/dashboard - Dashboard agent avec statistiques
router.get('/dashboard', async (req: Request, res: Response) => {
  const agentId = (req.user as any)?.id;
  if (!agentId) {
    console.warn("❌ Agent non authentifié");
    return res.status(401).json({ message: "Non authentifié" });
  }
  try {
    const agentId = req.user!.id;
    const dashboard = await AgentService.getAgentDashboard(agentId);

    res.json({
      message: 'Dashboard récupéré avec succès',
      data: dashboard
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Erreur lors de la récupération du dashboard'
    });
  }
});

// GET /agent/demandes - Liste des demandes assignées avec filtres
router.get('/demandes', async (req: Request, res: Response) => {
  const agentId = (req.user as any)?.id;
  if (!agentId) {
    console.warn("❌ Agent non authentifié");
    return res.status(401).json({ message: "Non authentifié" });
  }
  try {
    const agentId = req.user!.id;
    const {
      statut,
      typeCasier,
      dateDebut,
      dateFin,
      page = '1',
      limit = '10',
      search
    } = req.query;

    const filters = {
      statut: statut ? (Array.isArray(statut) ? statut : [statut]) as string[] : undefined,
      typeCasier: typeCasier ? (Array.isArray(typeCasier) ? typeCasier : [typeCasier]) as string[] : undefined,
      dateDebut: dateDebut ? new Date(dateDebut as string) : undefined,
      dateFin: dateFin ? new Date(dateFin as string) : undefined,
      search: search as string
    };

    const demandes = await AgentService.getAgentQueue(
      agentId,
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      message: 'Demandes récupérées avec succès',
      data: demandes
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Erreur lors de la récupération des demandes'
    });
  }
});

// GET /agent/demandes/:id - Détail d'une demande
router.get('/demandes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agentId = req.user!.id;

    const demande = await AgentService.getDemandeDetails(id, agentId);

    res.json({
      message: 'Détails récupérés avec succès',
      data: demande
    });
  } catch (error: any) {
    res.status(404).json({
      error: error.message || 'Demande non trouvée'
    });
  }
});

// PUT /agent/demandes/:id/valider - Valider une demande
router.put('/demandes/:id/valider', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { commentaire } = req.body;
    const agentId = req.user!.id;

    const result = await AgentService.traiterDemandeMixte(agentId, id, {
      action: 'VALIDER',
      commentaire: commentaire || ''
    });

    res.json({
      message: 'Demande validée avec succès',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Erreur lors de la validation de la demande'
    });
  }
});

// PUT /agent/demandes/:id/rejeter - Rejeter une demande
router.put('/demandes/:id/rejeter', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { commentaire } = req.body;
    const agentId = req.user!.id;

    const result = await AgentService.traiterDemandeMixte(agentId, id, {
      action: 'REJETER',
      commentaire: commentaire || ''
    });

    res.json({
      message: 'Demande rejetée avec succès',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Erreur lors du rejet de la demande'
    });
  }
});

// PUT /agent/demandes/:id/demander-infos - Demander des infos
router.put('/demandes/:id/demander-infos', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { documentsRequis } = req.body;
    const agentId = req.user!.id;

    const result = await AgentService.traiterDemandeMixte(agentId, id, {
      action: 'DEMANDER_INFOS',
      documentsRequis
    });

    res.json({
      message: 'Demande mise à jour avec demande d\'informations',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Erreur lors de la mise à jour de la demande'
    });
  }
});

// PUT /agent/demandes/:id/generer-casier - Générer le casier judiciaire
router.put('/demandes/:id/generer-casier', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { observations } = req.body;
    const agentId = req.user!.id;

    const result = await AgentService.traiterDemandeMixte(agentId, id, {
      action: 'GENERER_CASIER',
      commentaire: observations || ''
    });

    res.json({
      message: 'Casier judiciaire généré avec succès',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Erreur lors de la génération du casier'
    });
  }
});

// GET /agent/statistiques - Statistiques personnelles de l'agent
router.get('/statistiques', async (req: Request, res: Response) => {
  try {
    const agentId = req.user!.id;
    const { periode = 'mois' } = req.query;

    const stats = await AgentService.getAgentStats(agentId, periode as 'semaine' | 'mois' | 'trimestre');

    res.json({
      message: 'Statistiques récupérées avec succès',
      data: stats
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Erreur lors de la récupération des statistiques'
    });
  }
});

export default router;
