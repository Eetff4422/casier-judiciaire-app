// backend/src/services/assignmentService.ts
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface AgentWorkload {
  agentId: string;
  fullName: string;
  currentLoad: number;
  maxCapacity: number;
  averageProcessingTime: number;
  specializations: string[];
  isAvailable: boolean;
}

export class AssignmentService {
  static async getAgentsWorkload(): Promise<AgentWorkload[]> {
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT', isActive: true },
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
      maxCapacity: 1000, // plus de limite réelle
      averageProcessingTime: 24,
      specializations: [],
      isAvailable: true // toujours disponible
    }));
  }

  static calculateAssignmentScore(workload: AgentWorkload): number {
    const loadFactor = 1 - (workload.currentLoad / workload.maxCapacity);
    const availabilityBonus = workload.isAvailable ? 1 : 0.1;
    const efficiencyFactor = Math.max(0.1, 1 / workload.averageProcessingTime);
    return loadFactor * availabilityBonus * efficiencyFactor * 100;
  }

  static async assignDemandToAgent(demandeId: string): Promise<string> {
    try {
      const demande = await prisma.demandeCasier.findUnique({ where: { id: demandeId } });
      if (!demande) throw new Error('Demande non trouvée');
      if (demande.agentId) throw new Error('Demande déjà attribuée');

      const agentsWorkload = await this.getAgentsWorkload();
      if (agentsWorkload.length === 0) throw new Error('Aucun agent disponible');

      const agentsWithScores = agentsWorkload.map(agent => ({
        ...agent,
        score: this.calculateAssignmentScore(agent)
      })).sort((a, b) => b.score - a.score);

      const topAgents = agentsWithScores.slice(0, Math.min(3, agentsWithScores.length));
      const selectedAgent = topAgents[Math.floor(Math.random() * topAgents.length)];

      await prisma.demandeCasier.update({
        where: { id: demandeId },
        data: {
          agentId: selectedAgent.agentId,
          statut: 'EN_COURS',
          dateAttribution: new Date()
        }
      });

      console.log(`Demande ${demandeId} attribuée à l'agent ${selectedAgent.fullName} (score: ${selectedAgent.score})`);
      return selectedAgent.agentId;
    } catch (error) {
      console.error('Erreur lors de l\'attribution:', error);
      throw error;
    }
  }

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

  static async autoAssignPendingDemands(): Promise<void> {
    try {
      const pendingDemands = await prisma.demandeCasier.findMany({
        where: { statut: 'SOUMISE', agentId: null },
        orderBy: { createdAt: 'asc' }
      });

      if (pendingDemands.length === 0) {
        console.log('Aucune demande en attente d\'attribution');
        return;
      }

      console.log(`Attribution automatique de ${pendingDemands.length} demande(s)`);

      for (const demande of pendingDemands) {
        try {
          await this.assignDemandToAgent(demande.id);
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Impossible d'attribuer la demande ${demande.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'attribution automatique:', error);
    }
  }

  static async reassignDemand(demandeId: string, newAgentId?: string): Promise<void> {
    try {
      if (newAgentId) {
        const agent = await prisma.user.findUnique({
          where: { id: newAgentId, role: 'AGENT', isActive: true }
        });
        if (!agent) throw new Error('Agent non trouvé ou inactif');

        await prisma.demandeCasier.update({
          where: { id: demandeId },
          data: { agentId: newAgentId, dateAttribution: new Date() }
        });
      } else {
        await prisma.demandeCasier.update({
          where: { id: demandeId },
          data: { agentId: null, statut: 'SOUMISE' }
        });
        await this.assignDemandToAgent(demandeId);
      }
    } catch (error) {
      console.error('Erreur lors de la réattribution:', error);
      throw error;
    }
  }

  static async getAssignmentStats() {
    const stats = await prisma.demandeCasier.groupBy({
      by: ['agentId', 'statut'],
      _count: { id: true },
      where: { agentId: { not: null } }
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
        totalDemands: stats.filter(stat => stat.agentId === agent.id).reduce((sum, stat) => sum + stat._count.id, 0),
        byStatus: stats.filter(stat => stat.agentId === agent.id).reduce((acc, stat) => ({ ...acc, [stat.statut]: stat._count.id }), {})
      }))
    };
  }
}

export const assignAgentAutomatically = async (): Promise<string> => {
  const temp = await prisma.demandeCasier.create({
    data: {
      typeCasier: 'B3',
      statut: 'EN_COURS',
      modeReception: 'EN_LIGNE',
      canalNotification: 'EMAIL',
      estAnonyme: true,
      nomAnonyme: 'Temp',
      prenomAnonyme: 'Temp',
      emailAnonyme: 'temp@temp.com',
      telephoneAnonyme: '0000000000',
      suiviCode: crypto.randomBytes(8).toString('hex')
    }
  });

  const agentId = await AssignmentService.assignDemandToAgent(temp.id);
  await prisma.demandeCasier.delete({ where: { id: temp.id } });
  return agentId;
};
