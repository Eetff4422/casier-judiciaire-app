// backend/src/services/agentService.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DemandeFilters {
  statut?: string[];
  typeCasier?: string[];
  dateDebut?: Date;
  dateFin?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TraitementData {
  action: 'VALIDER' | 'DEMANDER_INFOS' | 'REJETER' | 'GENERER_CASIER';
  commentaire?: string;
  documentsRequis?: string[];
  motifRejet?: string;
}

export class AgentService {
  static async getAgentDashboard(agentId: string) {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      include: {
        demandesTraitees: {
          include: {
            demandeur: {
              select: { fullName: true, email: true }
            },
            documents: true
          }
        }
      }
    });

    if (!agent) {
      throw new Error('Agent non trouvé');
    }

    const stats = {
      enCours: agent.demandesTraitees.filter(d => d.statut === 'EN_COURS').length,
      enAttente: agent.demandesTraitees.filter(d => d.statut === 'INFORMATIONS_MANQUANTES').length,
      terminees: agent.demandesTraitees.filter(d => d.statut === 'TERMINEE').length,
      rejetees: agent.demandesTraitees.filter(d => d.statut === 'REJETEE').length,
      total: agent.demandesTraitees.length
    };

    const dernierMois = new Date();
    dernierMois.setDate(dernierMois.getDate() - 30);

    const demandesRecentes = await prisma.demandeCasier.findMany({
      where: {
        agentId,
        statut: 'TERMINEE',
        dateValidation: { gte: dernierMois }
      }
    });

    const tempsTraitementMoyen = demandesRecentes.length > 0
      ? demandesRecentes.reduce((acc, demande) => {
          if (demande.dateAttribution && demande.dateValidation) {
            return acc + (demande.dateValidation.getTime() - demande.dateAttribution.getTime());
          }
          return acc;
        }, 0) / demandesRecentes.length / (1000 * 60 * 60)
      : 0;

    return {
      agent: {
        id: agent.id,
        fullName: agent.fullName,
        email: agent.email
      },
      stats,
      tempsTraitementMoyen: Math.round(tempsTraitementMoyen * 100) / 100,
      demandesUrgentes: agent.demandesTraitees
        .filter(d => {
          const daysSinceCreation = (Date.now() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceCreation > 7 && ['EN_COURS', 'INFORMATIONS_MANQUANTES'].includes(d.statut);
        })
        .length
    };
  }

  static async getAgentQueue(agentId: string, filters: DemandeFilters = {}, page = 1, limit = 10) {
    const {
      statut = ['EN_COURS', 'INFORMATIONS_MANQUANTES'],
      typeCasier,
      dateDebut,
      dateFin,
      search
    } = filters;

    const whereClause: any = {
      agentId,
      statut: { in: statut }
    };

    if (typeCasier && typeCasier.length > 0) {
      whereClause.typeCasier = { in: typeCasier };
    }

    if (dateDebut || dateFin) {
      whereClause.createdAt = {};
      if (dateDebut) whereClause.createdAt.gte = dateDebut;
      if (dateFin) whereClause.createdAt.lte = dateFin;
    }

    if (search) {
      whereClause.OR = [
        { demandeur: { fullName: { contains: search, mode: 'insensitive' } } },
        { demandeur: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [demandes, total] = await Promise.all([
      prisma.demandeCasier.findMany({
        where: whereClause,
        include: {
          demandeur: {
            select: { id: true, fullName: true, email: true }
          },
          documents: {
            select: { id: true, nom: true, typeDocument: true, createdAt: true }
          }
        },
        orderBy: [
          { createdAt: 'asc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.demandeCasier.count({ where: whereClause })
    ]);

    return {
      demandes: demandes.map(demande => ({
        ...demande,
        priorite: this.calculatePriority(demande),
        tempsEcoule: this.getTimeElapsed(demande.createdAt)
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  private static calculatePriority(demande: any): 'HAUTE' | 'MOYENNE' | 'BASSE' {
    const daysSinceCreation = (Date.now() - demande.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 10) return 'HAUTE';
    if (daysSinceCreation > 5) return 'MOYENNE';
    return 'BASSE';
  }

  private static getTimeElapsed(createdAt: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return diffDays > 0 ? `${diffDays}j ${diffHours}h` : `${diffHours}h`;
  }

  static async traiterDemande(agentId: string, demandeId: string, traitement: TraitementData) {
    const demande = await prisma.demandeCasier.findFirst({
      where: { id: demandeId, agentId },
      include: { demandeur: true }
    });

    if (!demande) throw new Error('Demande non trouvée ou non attribuée à cet agent');

    const { action, commentaire, documentsRequis, motifRejet } = traitement;

    switch (action) {
      case 'VALIDER':
        await prisma.demandeCasier.update({
          where: { id: demandeId },
          data: { statut: 'EN_VALIDATION', dateTraitement: new Date() }
        });
        break;
      case 'DEMANDER_INFOS':
        await prisma.demandeCasier.update({
          where: { id: demandeId },
          data: { statut: 'INFORMATIONS_MANQUANTES' }
        });
        break;
      case 'REJETER':
        if (!motifRejet) throw new Error('Motif de rejet requis');
        await prisma.demandeCasier.update({
          where: { id: demandeId },
          data: { statut: 'REJETEE', motifRejet, dateTraitement: new Date() }
        });
        break;
      case 'GENERER_CASIER':
        const casierPath = await this.genererCasierJudiciaire(demande);
        await prisma.demandeCasier.update({
          where: { id: demandeId },
          data: { statut: 'TERMINEE', dateTraitement: new Date() }
        });
        break;
    }

    return { message: 'Demande traitée avec succès' };
  }

  private static async genererCasierJudiciaire(demande: any): Promise<string> {
    console.log(`Génération du casier ${demande.typeCasier} pour ${demande.demandeur.fullName}`);
    return `/casiers/${demande.id}.pdf`;
  }

  static async getHistoriqueTraitement(agentId: string, filters: DemandeFilters = {}) {
    const {
      statut = ['TERMINEE', 'REJETEE'],
      dateDebut,
      dateFin,
      page = 1,
      limit = 20
    } = filters;

    const whereClause: any = {
      agentId,
      statut: { in: statut }
    };

    if (dateDebut || dateFin) {
      whereClause.dateTraitement = {};
      if (dateDebut) whereClause.dateTraitement.gte = dateDebut;
      if (dateFin) whereClause.dateTraitement.lte = dateFin;
    }

    const [demandes, total] = await Promise.all([
      prisma.demandeCasier.findMany({
        where: whereClause,
        include: {
          demandeur: {
            select: { fullName: true, email: true }
          }
        },
        orderBy: { dateTraitement: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.demandeCasier.count({ where: whereClause })
    ]);

    return {
      demandes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getAgentStats(agentId: string, periode: 'semaine' | 'mois' | 'trimestre' = 'mois') {
    const dateDebut = new Date();
    switch (periode) {
      case 'semaine':
        dateDebut.setDate(dateDebut.getDate() - 7);
        break;
      case 'mois':
        dateDebut.setMonth(dateDebut.getMonth() - 1);
        break;
      case 'trimestre':
        dateDebut.setMonth(dateDebut.getMonth() - 3);
        break;
    }

    const demandes = await prisma.demandeCasier.findMany({
      where: {
        agentId,
        createdAt: { gte: dateDebut }
      }
    });

    return {
      periode,
      totalDemandes: demandes.length,
      parStatut: demandes.reduce((acc, d) => {
        acc[d.statut] = (acc[d.statut] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      parType: demandes.reduce((acc, d) => {
        acc[d.typeCasier] = (acc[d.typeCasier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      tauxReussite: demandes.length > 0
        ? Math.round((demandes.filter(d => d.statut === 'TERMINEE').length / demandes.length) * 100)
        : 0
    };
  }

  static async getDemandeDetails(demandeId: string, agentId: string) {
    const demande = await prisma.demandeCasier.findFirst({
      where: {
        id: demandeId,
        agentId
      },
      include: {
        demandeur: {
          select: { fullName: true, email: true }
        },
        documents: true
      }
    });

    if (!demande) {
      throw new Error('Demande non trouvée ou non assignée à cet agent');
    }

    return demande;
  }
}
