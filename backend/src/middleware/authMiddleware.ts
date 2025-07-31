// backend/src/middleware/authMiddleware.ts
import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/authService';

// Étendre l'interface Request pour inclure user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

// Middleware d'authentification principal
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ 
      error: 'Token d\'accès requis' 
    });
  }

  try {
    const decoded = AuthService.verifyToken(token);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    return res.status(403).json({ 
      error: 'Token invalide ou expiré' 
    });
  }
};

// Middleware pour vérifier les rôles
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentification requise' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Permissions insuffisantes' 
      });
    }

    next();
  };
};

// Middleware spécifiques par rôle
export const requireDemandeur = requireRole(['DEMANDEUR']);
export const requireAgent = requireRole(['AGENT', 'SUPERVISEUR', 'ADMIN']);
export const requireSuperviseur = requireRole(['SUPERVISEUR', 'ADMIN']);
export const requireAdmin = requireRole(['ADMIN']);

// Middleware pour les agents et superviseurs
export const requireAgentOrSuperviseur = requireRole(['AGENT', 'SUPERVISEUR', 'ADMIN']);

// Middleware optionnel (utilisateur connecté ou non)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = AuthService.verifyToken(token);
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
    } catch (error) {
      // Token invalide, mais on continue sans utilisateur
    }
  }

  next();
};