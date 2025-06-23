// backend/src/routes/adminRoutes.ts
import { Request, Response, Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';
import { AdminService } from '../services/adminService';

const router = Router();

// Middleware : admin uniquement
router.use(authenticateToken, requireAdmin);

// GET /admin/users → Liste des utilisateurs groupés par rôle
router.get('/users', async (req: Request, res: Response) => {
  try {
    const result = await AdminService.getAllUsersGroupedByRole();
    res.json(result);
  } catch (error) {
    console.error('Erreur récupération utilisateurs admin :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /admin/users/:id/role → Modifier le rôle d'un utilisateur
router.patch('/users/:id/role', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { newRole } = req.body;
  try {
    const updated = await AdminService.updateUserRole(id, newRole);
    res.json(updated);
  } catch (error) {
    console.error('Erreur modification rôle :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /admin/users/:id/toggle → Suspendre ou réactiver un utilisateur
router.patch('/users/:id/toggle', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await AdminService.toggleUserActiveStatus(id);
    res.json(result);
  } catch (error) {
    console.error('Erreur suspension utilisateur :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
