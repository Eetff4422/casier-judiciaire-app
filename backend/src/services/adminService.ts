// backend/src/services/adminService.ts
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminService {
  // Lister tous les utilisateurs regroupés par rôle
  static async getAllUsersGroupedByRole() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        statut: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    const grouped: Record<Role, typeof users> = {
      DEMANDEUR: [],
      AGENT: [],
      SUPERVISEUR: [],
      ADMIN: [],
    };

    users.forEach(user => {
      grouped[user.role].push(user);
    });

    return grouped;
  }

  // Modifier le rôle d’un utilisateur
  static async updateUserRole(userId: string, newRole: Role) {
    return prisma.user.update({
      where: { id: userId },
      data: { role: newRole }
    });
  }

  // Suspendre un utilisateur
  static async suspendUser(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { statut: 'SUSPENDU' }
    });
  }

  // Réactiver un utilisateur
  static async reactivateUser(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { statut: 'ACTIF' }
    });
  }

  // Activer ou suspendre un utilisateur selon son statut actuel
  static async toggleUserActiveStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { statut: true }
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    const nouveauStatut = user.statut === 'ACTIF' ? 'SUSPENDU' : 'ACTIF';

    return prisma.user.update({
      where: { id: userId },
      data: { statut: nouveauStatut }
    });
  }
}
