// backend/src/routes/authRoutes.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/authMiddleware';
import { AuthService, RegisterData } from '../services/authService';
dotenv.config();

const prisma = new PrismaClient();

const router = Router();

// --------- Helpers ---------
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) return { isValid: false, message: 'Le mot de passe doit contenir au moins 8 caractères' };
  if (!/(?=.*[a-z])/.test(password)) return { isValid: false, message: 'Le mot de passe doit contenir une minuscule' };
  if (!/(?=.*[A-Z])/.test(password)) return { isValid: false, message: 'Le mot de passe doit contenir une majuscule' };
  if (!/(?=.*\d)/.test(password)) return { isValid: false, message: 'Le mot de passe doit contenir un chiffre' };
  return { isValid: true };
};

const generateToken = (user: any) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET as string,
    { expiresIn: '24h' }
  );
};


// --------- Routes ---------

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, role, securityQuestion, securityAnswer } = req.body;

    if (!email || !password || !fullName || !role || !securityQuestion || !securityAnswer) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide' });
    }

    const pwdValidation = validatePassword(password);
    if (!pwdValidation.isValid) {
      return res.status(400).json({ error: pwdValidation.message });
    }

    const validRoles: RegisterData['role'][] = ['DEMANDEUR', 'AGENT', 'SUPERVISEUR', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }

    if (securityQuestion.trim().length < 10 || securityAnswer.trim().length < 2) {
      return res.status(400).json({ error: 'Question ou réponse de sécurité trop courte' });
    }

    const result = await AuthService.register({
      email: email.toLowerCase().trim(),
      password,
      fullName: fullName.trim(),
      role: role as RegisterData['role'],
      securityQuestion: securityQuestion.trim(),
      securityAnswer: securityAnswer.trim()
    });

    res.status(201).json({ message: 'Compte créé', user: result.user, token: result.token });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erreur création compte' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return res.status(401).json({ error: 'Identifiants invalides' });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(401).json({ error: 'Identifiants invalides' });

  // ✅ Ajouter ce contrôle ici :
  if (user.statut === 'SUSPENDU') {
    return res.status(403).json({ error: 'Compte suspendu. Veuillez contacter un administrateur.' });
  }

  // Générer token et renvoyer
  const token = generateToken(user);
  return res.json({ token, user });
});


// GET /auth/me
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const user = await AuthService.getUserById(req.user.id);
    res.json({ user });
  } catch (error: any) {
    res.status(404).json({ error: error.message || 'Utilisateur non trouvé' });
  }
});

// POST /auth/recover
router.post('/recover', async (req: Request, res: Response) => {
  try {
    const { email, securityAnswer, newPassword } = req.body;

    if (!email || !securityAnswer || !newPassword) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    const pwdValidation = validatePassword(newPassword);
    if (!pwdValidation.isValid) {
      return res.status(400).json({ error: pwdValidation.message });
    }

    const result = await AuthService.recoverAccount(
      email.toLowerCase().trim(),
      securityAnswer.trim(),
      newPassword
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erreur récupération de compte' });
  }
});

// POST /auth/logout
router.post('/logout', authenticateToken, (_req, res) => {
  res.json({ message: 'Déconnexion réussie' });
});

export default router;
