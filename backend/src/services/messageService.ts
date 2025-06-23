// backend/src/services/messageService.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MessageService {
  static async envoyerMessage(fromId: string, toId: string, demandeId: string, content: string) {
    return await prisma.message.create({
      data: {
        fromId,
        toId,
        demandeId,
        content,
        lu: false
      }
    });
  }

  static async getMessagesParDemande(demandeId: string, userId: string) {
    return await prisma.message.findMany({
      where: {
        demandeId,
        OR: [{ fromId: userId }, { toId: userId }]
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }

  static async marquerCommeLu(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });

    if (!message) {
      throw new Error('Message introuvable');
    }

    if (message.toId !== userId) {
      throw new Error('Accès non autorisé à ce message');
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { lu: true }
    });

    return updated;
  }
}
