// backend/src/services/superviseurService.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SuperviseurService {
  static async getDemandesEnCours() {
    return prisma.demandeCasier.findMany({
      where: {
        statut: { in: ['EN_VALIDATION', 'INFORMATIONS_MANQUANTES'] }
      },
      include: {
        demandeur: { select: { fullName: true, email: true } },
        agent: { select: { fullName: true, email: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  static async getDemandesControleQualite(filters: {
  statut?: string;
  search?: string;
  dateDebut?: string;
  dateFin?: string;
  page?: number;
  limit?: number;
}) {
  const { statut, search, dateDebut, dateFin, page = 1, limit = 10 } = filters;

  const where: any = {
    statut: { in: ['TERMINEE', 'REJETEE'] }
  };

  if (statut) {
    where.statut = statut;
  }

  if (search) {
    where.demandeur = {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    };
  }

  if (dateDebut || dateFin) {
    where.createdAt = {};
    if (dateDebut) where.createdAt.gte = new Date(dateDebut);
    if (dateFin) where.createdAt.lte = new Date(dateFin);
  }

  const skip = (page - 1) * limit;

  const [demandes, total] = await Promise.all([
    prisma.demandeCasier.findMany({
      where,
      include: {
        demandeur: { select: { fullName: true, email: true } }
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.demandeCasier.count({ where })
  ]);

  return {
    demandes,
    pagination: {
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    }
  };
}
}
