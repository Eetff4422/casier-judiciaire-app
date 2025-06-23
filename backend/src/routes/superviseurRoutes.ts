import { PrismaClient } from '@prisma/client';
import { Request, Response, Router } from 'express';
import { Parser } from 'json2csv';
import { authenticateToken, requireSuperviseur } from '../middleware/authMiddleware';
import { SuperviseurService } from '../services/superviseurService';

const router = Router();
const prisma = new PrismaClient();

// Middleware d'authentification + vérification du rôle
router.use(authenticateToken, requireSuperviseur);

// GET /superviseur/controle-qualite
router.get('/controle-qualite', async (req: Request, res: Response) => {
  try {
    const {
      statut,
      search,
      dateDebut,
      dateFin,
      page = '1',
      limit = '10'
    } = req.query;

    const result = await SuperviseurService.getDemandesControleQualite({
      statut: statut as string,
      search: search as string,
      dateDebut: dateDebut as string,
      dateFin: dateFin as string,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });

    res.json({ data: result });
  } catch (error) {
    console.error('Erreur contrôle qualité superviseur :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
router.get('/export', async (req: Request, res: Response) => {
  try {
    const demandes = await SuperviseurService.getDemandesControleQualite({ limit: 1000 }); // limite export

    const csvFields = ['id', 'typeCasier', 'statut', 'createdAt', 'demandeur.fullName', 'demandeur.email'];
    const parser = new Parser({ fields: csvFields });
    const csv = parser.parse(
      demandes.demandes.map((d) => ({
        id: d.id,
        typeCasier: d.typeCasier,
        statut: d.statut,
        createdAt: new Date(d.createdAt).toLocaleString(),
        'demandeur.fullName': d.demandeur.fullName,
        'demandeur.email': d.demandeur.email
      }))
    );

    res.header('Content-Type', 'text/csv');
    res.attachment('demandes.csv');
    res.send(csv);
  } catch (error) {
    console.error('Erreur export CSV :', error);
    res.status(500).send('Erreur serveur');
  }
});


export default router;
