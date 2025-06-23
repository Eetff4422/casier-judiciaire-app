// backend/src/services/assignmentService.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AgentWorkload {
  agentId: string;
  fullName: string;
  currentLoad: number;
  maxCapacity: number;
  averageProcessingTime: number; // en heures
  specializations: string[]; // Types de casiers spécialisés si besoin
  isAvailable: boolean;
}

export class AssignmentService {
  
  // Obtenir la charge de travail actuelle de tous les agents
  static async getAgentsWorkload(): Promise<AgentWorkload[]> {
    const agents = await prisma.user.findMany({
      where: { 
        role: 'AGENT',
        isActive: true 
      },
      include: {
        demandesTraitees: {
          where: {
            statut: {
              in: ['EN_COURS', 'INFORMATIONS_MANQUANTES']
            }
          }
        }
      }
    });

    return agents.map(agent => ({
      agentId: agent.id,
      fullName: agent.fullName,
      currentLoad: agent.demandesTraitees.length,
      maxCapacity: 10, // Configurable selon les besoins
      averageProcessingTime: 24, // À calculer selon l'historique
      specializations: [], // À implémenter si spécialisations par type
      isAvailable: agent.demandesTraitees.length < 10
    }));
  }

  // Calculer le score de priorité pour l'attribution
  static calculateAssignmentScore(workload: AgentWorkload): number {
    const loadFactor = 1 - (workload.currentLoad / workload.maxCapacity);
    const availabilityBonus = workload.isAvailable ? 1 : 0.1;
    const efficiencyFactor = Math.max(0.1, 1 / workload.averageProcessingTime);
    
    return loadFactor * availabilityBonus * efficiencyFactor * 100;
  }

  // Algorithme d'attribution intelligent
  static async assignDemandToAgent(demandeId: string): Promise<string> {
    try {
      // Vérifier que la demande existe et n'est pas déjà attribuée
      const demande = await prisma.demandeCasier.findUnique({
        where: { id: demandeId }
      });

      if (!demande) {
        throw new Error('Demande non trouvée');
      }

      if (demande.agentId) {
        throw new Error('Demande déjà attribuée');
      }

      // Obtenir la charge de travail des agents
      const agentsWorkload = await this.getAgentsWorkload();
      
      if (agentsWorkload.length === 0) {
        throw new Error('Aucun agent disponible');
      }

      // Filtrer les agents disponibles
      const availableAgents = agentsWorkload.filter(agent => agent.isAvailable);
      
      if (availableAgents.length === 0) {
        throw new Error('Tous les agents sont à pleine capacité');
      }

      // Calculer les scores et trier
      const agentsWithScores = availableAgents.map(agent => ({
        ...agent,
        score: this.calculateAssignmentScore(agent)
      })).sort((a, b) => b.score - a.score);

      // Sélection avec part d'aléatoire parmi les 3 meilleurs
      const topAgents = agentsWithScores.slice(0, Math.min(3, agentsWithScores.length));
      const selectedAgent = topAgents[Math.floor(Math.random() * topAgents.length)];

      // Attribuer la demande
      await prisma.demandeCasier.update({
        where: { id: demandeId },
        data: {
          agentId: selectedAgent.agentId,
          statut: 'EN_COURS',
          dateAttribution: new Date()
        }
      });

      // Logger l'attribution
      console.log(`Demande ${demandeId} attribuée à l'agent ${selectedAgent.fullName} (score: ${selectedAgent.score})`);

      return selectedAgent.agentId;

    } catch (error) {
      console.error('Erreur lors de l\'attribution:', error);
      throw error;
    }
  }

  // Attribution en lot de plusieurs demandes
  static async assignMultipleDemands(demandeIds: string[]): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    
    for (const demandeId of demandeIds) {
      try {
        const agentId = await this.assignDemandToAgent(demandeId);
        results[demandeId] = agentId;
      } catch (error) {
        console.error(`Erreur attribution demande ${demandeId}:`, error);
        results[demandeId] = 'ERREUR';
      }
    }

    return results;
  }

  // Attribution automatique des nouvelles demandes (à exécuter périodiquement)
  static async autoAssignPendingDemands(): Promise<void> {
    try {
      // Récupérer toutes les demandes non attribuées
      const pendingDemands = await prisma.demandeCasier.findMany({
        where: {
          statut: 'SOUMISE',
          agentId: null
        },
        orderBy: {
          createdAt: 'asc' // FIFO
        }
      });

      if (pendingDemands.length === 0) {
        console.log('Aucune demande en attente d\'attribution');
        return;
      }

      console.log(`Attribution automatique de ${pendingDemands.length} demande(s)`);

      // Attribuer chaque demande
      for (const demande of pendingDemands) {
        try {
          await this.assignDemandToAgent(demande.id);
          // Petit délai pour éviter la surcharge
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Impossible d'attribuer la demande ${demande.id}:`, error);
        }
      }

    } catch (error) {
      console.error('Erreur lors de l\'attribution automatique:', error);
    }
  }

  // Réattribuer une demande à un autre agent
  static async reassignDemand(demandeId: string, newAgentId?: string): Promise<void> {
    try {
      if (newAgentId) {
        // Attribution manuelle à un agent spécifique
        const agent = await prisma.user.findUnique({
          where: { id: newAgentId, role: 'AGENT', isActive: true }
        });

        if (!agent) {
          throw new Error('Agent non trouvé ou inactif');
        }

        await prisma.demandeCasier.update({
          where: { id: demandeId },
          data: {
            agentId: newAgentId,
            dateAttribution: new Date()
          }
        });
      } else {
        // Réattribution automatique
        await prisma.demandeCasier.update({
          where: { id: demandeId },
          data: {
            agentId: null,
            statut: 'SOUMISE'
          }
        });

        await this.assignDemandToAgent(demandeId);
      }

    } catch (error) {
      console.error('Erreur lors de la réattribution:', error);
      throw error;
    }
  }

  // Statistiques d'attribution
  static async getAssignmentStats() {
    const stats = await prisma.demandeCasier.groupBy({
      by: ['agentId', 'statut'],
      _count: {
        id: true
      },
      where: {
        agentId: { not: null }
      }
    });

    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' },
      select: { id: true, fullName: true }
    });

    return {
      totalAssigned: stats.reduce((sum, stat) => sum + stat._count.id, 0),
      byAgent: agents.map(agent => ({
        agentId: agent.id,
        fullName: agent.fullName,
        totalDemands: stats
          .filter(stat => stat.agentId === agent.id)
          .reduce((sum, stat) => sum + stat._count.id, 0),
        byStatus: stats
          .filter(stat => stat.agentId === agent.id)
          .reduce((acc, stat) => ({
            ...acc,
            [stat.statut]: stat._count.id
          }), {})
      }))
    };
  }
}