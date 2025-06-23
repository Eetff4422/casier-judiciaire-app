// backend/src/services/notificationService.ts
import { WebSocket } from 'ws';

type Client = {
  userId: string;
  socket: WebSocket;
};

class NotificationService {
  private clients: Map<string, Set<WebSocket>> = new Map();

  // Enregistrer un nouveau client connecté
  registerClient(userId: string, socket: WebSocket) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(socket);

    console.log(`✅ Client WebSocket enregistré pour user ${userId}`);
  }

  // Supprimer un client déconnecté
  unregisterClient(socket: WebSocket) {
    for (const [userId, sockets] of this.clients.entries()) {
      if (sockets.has(socket)) {
        sockets.delete(socket);
        console.log(`⛔ Déconnexion WebSocket pour user ${userId}`);
        if (sockets.size === 0) {
          this.clients.delete(userId);
        }
        break;
      }
    }
  }

  // Envoyer une notification à un utilisateur spécifique
  sendToUser(userId: string, payload: any) {
    const sockets = this.clients.get(userId);
    if (!sockets) return;

    const message = JSON.stringify(payload);
    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    }

    console.log(`📤 Notification envoyée à l'utilisateur ${userId}`);
  }

  // Broadcast à tous les utilisateurs connectés
  broadcast(payload: any) {
    const message = JSON.stringify(payload);
    for (const sockets of this.clients.values()) {
      for (const socket of sockets) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(message);
        }
      }
    }

    console.log('📣 Broadcast à tous les utilisateurs');
  }
}

export const notificationService = new NotificationService();
