// backend/src/index.ts
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import adminRoutes from './routes/adminRoutes';
import agentRoutes from './routes/agentRoutes';
import authRoutes from './routes/authRoutes';
import demandeRoutes from './routes/demandeRoutes';
import messageRoutes from './routes/messageRoutes';
import publicDemandeRoutes from './routes/publicDemandeRoutes';
import superviseurRoutes from './routes/superviseurRoutes';
import { notificationService } from './services/notificationService';


// Charger les variables d'environnement
dotenv.config();

const app = express();
const server = http.createServer(app); // Serveur HTTP requis pour WebSocket
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Middlewares globaux
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes REST
app.use('/api/auth', authRoutes);
app.use('/api/demandes', demandeRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/superviseur', superviseurRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/public-demande', publicDemandeRoutes);


// Route de test
app.get('/api/health', (req, res) => {
  res.json({
    message: 'API Casier Judiciaire - Système opérationnel',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion d'erreur
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});
// 🎯 WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (socket, req) => {
  const params = new URLSearchParams(req.url?.split('?')[1]);
  const token = params.get('token');

  if (!token) {
    socket.close(1008, 'Token manquant');
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = payload.userId;

    notificationService.registerClient(userId, socket);

    socket.on('close', () => {
      notificationService.unregisterClient(socket);
    });
  } catch (err) {
    socket.close(1008, 'Token invalide');
  }
});

// Démarrage du serveur
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔧 Environnement: ${process.env.NODE_ENV || 'development'}`);
});
