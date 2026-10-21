import { defineStore } from 'pinia';
import { agentApi } from '@/features/office/services/agent.api';
import type { Agent, AgentStatus, UpdateAgentPayload } from '@/types/agent';

interface AgentState {
  agents: Agent[];
  selectedAgentId: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  lastSyncAt: Date | null;
}

export const useAgentStore = defineStore('agent', {
  state: (): AgentState => ({
    agents: [],
    selectedAgentId: null,
    isLoading: false,
    isSyncing: false,
    error: null,
    lastSyncAt: null,
  }),

  getters: {
    /**
     * Retourne l'agent actuellement sélectionné pour interaction
     */
    selectedAgent(state): Agent | null {
      if (!state.selectedAgentId) return null;
      return state.agents.find((agent) => agent.id === state.selectedAgentId) || null;
    },

    /**
     * Liste des agents actuellement en ligne (détectés sous Ollama)
     */
    onlineAgents(state): Agent[] {
      return state.agents.filter((a) => a.status === 'online' || a.status === 'busy' || a.status === 'thinking');
    },

    /**
     * Liste des agents actuellement hors-ligne
     */
    offlineAgents(state): Agent[] {
      return state.agents.filter((a) => a.status === 'offline');
    },

    /**
     * Nombre total d'agents enregistrés
     */
    totalCount(state): number {
      return state.agents.length;
    },

    /**
     * Indique si au moins un modèle Ollama est opérationnel
     */
    isOllamaConnected(state): boolean {
      return state.agents.some((a) => a.status !== 'offline');
    },

    /**
     * Recherche un agent par ses coordonnées sur la grille du bureau pixel art
     */
    getAgentAtPosition: (state) => (x: number, y: number): Agent | undefined => {
      return state.agents.find((a) => a.positionX === x && a.positionY === y);
    },
  },

  actions: {
    /**
     * Charge l'ensemble des agents depuis le backend
     */
    async loadAgents(): Promise<void> {
      this.isLoading = true;
      this.error = null;
      try {
        const data = await agentApi.fetchAgents();
        this.agents = data;
      } catch (err: any) {
        this.error = err.message || 'Erreur lors du chargement des agents.';
        console.error('[AgentStore.loadAgents]', err);
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Lance la synchronisation avec Ollama pour importer ou mettre à jour les modèles locaux
     */
    async syncWithOllama(): Promise<void> {
      this.isSyncing = true;
      this.error = null;
      try {
        const data = await agentApi.syncAgentsWithOllama();
        this.agents = data;
        this.lastSyncAt = new Date();
      } catch (err: any) {
        this.error = err.message || 'Impossible de synchroniser avec Ollama.';
        console.error('[AgentStore.syncWithOllama]', err);
      } finally {
        this.isSyncing = false;
      }
    },

    /**
     * Définit l'agent actif / sélectionné
     */
    selectAgent(agentId: string | null): void {
      this.selectedAgentId = agentId;
    },

    /**
     * Met à jour le statut visuel d'un agent (ex: 'thinking' ou 'busy' durant le streaming)
     */
    setAgentStatus(agentId: string, status: AgentStatus): void {
      const target = this.agents.find((a) => a.id === agentId);
      if (target) {
        target.status = status;
      }
    },

    /**
     * Sauvegarde les modifications de configuration d'un agent (rôle, prompt, position)
     */
    async updateAgentConfig(agentId: string, payload: UpdateAgentPayload): Promise<Agent | null> {
      this.error = null;
      try {
        const updated = await agentApi.updateAgent(agentId, payload);
        const index = this.agents.findIndex((a) => a.id === agentId);
        if (index !== -1) {
          this.agents[index] = { ...this.agents[index], ...updated };
        }
        return updated;
      } catch (err: any) {
        this.error = err.message || 'Erreur lors de la mise à jour de l’agent.';
        console.error('[AgentStore.updateAgentConfig]', err);
        return null;
      }
    },
  },
});
