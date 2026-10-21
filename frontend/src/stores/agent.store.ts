import { defineStore } from 'pinia';
import { agentApi } from '@/features/office/services/agent.api';
import { ollamaApi } from '@/features/office/services/ollama.api';
import type {
  Agent,
  AgentStatus,
  CreateAgentPayload,
  UpdateAgentPayload,
} from '@/types/agent';

interface AgentState {
  agents: Agent[];
  selectedAgentId: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  isCreating: boolean;
  error: string | null;
  lastSyncAt: Date | null;
}

export const useAgentStore = defineStore('agent', {
  state: (): AgentState => ({
    agents: [],
    selectedAgentId: null,
    isLoading: false,
    isSyncing: false,
    isCreating: false,
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

    /**
     * Déplace un agent sur la grille pixel art.
     * L'API échange automatiquement les positions si la case cible est occupée :
     * on applique le même résultat en local pour un rendu instantané.
     */
    async moveAgent(agentId: string, positionX: number, positionY: number): Promise<Agent | null> {
      this.error = null;
      const moving = this.agents.find((a) => a.id === agentId);
      if (!moving) return null;

      const previousX = moving.positionX;
      const previousY = moving.positionY;
      const occupant = this.agents.find(
        (a) => a.id !== agentId && a.positionX === positionX && a.positionY === positionY
      );

      // Mise à jour optimiste
      moving.positionX = positionX;
      moving.positionY = positionY;
      if (occupant) {
        occupant.positionX = previousX;
        occupant.positionY = previousY;
      }

      try {
        const updated = await agentApi.moveAgent(agentId, positionX, positionY);
        const index = this.agents.findIndex((a) => a.id === agentId);
        if (index !== -1) {
          this.agents[index] = { ...this.agents[index], ...updated };
        }
        return updated;
      } catch (err: any) {
        // Rollback en cas d'échec
        moving.positionX = previousX;
        moving.positionY = previousY;
        if (occupant) {
          occupant.positionX = positionX;
          occupant.positionY = positionY;
        }
        this.error = err.message || 'Impossible de déplacer l’agent sur la grille.';
        console.error('[AgentStore.moveAgent]', err);
        return null;
      }
    },

    /**
     * Retire définitivement un agent du bureau
     */
    async removeAgent(agentId: string): Promise<boolean> {
      this.error = null;
      try {
        await agentApi.deleteAgent(agentId);
        this.agents = this.agents.filter((a) => a.id !== agentId);
        if (this.selectedAgentId === agentId) {
          this.selectedAgentId = null;
        }
        return true;
      } catch (err: any) {
        this.error = err.message || 'Erreur lors de la suppression de l’agent.';
        console.error('[AgentStore.removeAgent]', err);
        return false;
      }
    },

    /**
     * Crée un nouvel assistant depuis l'interface
     */
    async createAgent(payload: CreateAgentPayload): Promise<Agent | null> {
      this.error = null;
      this.isCreating = true;
      try {
        const created = await ollamaApi.createAgent(payload);
        this.agents = [...this.agents, created];
        return created;
      } catch (err: any) {
        this.error = err.message || 'Impossible de créer cet assistant.';
        console.error('[AgentStore.createAgent]', err);
        return null;
      } finally {
        this.isCreating = false;
      }
    },

    /**
     * Efface le message d'erreur courant (utilisé par la bannière d'alerte)
     */
    clearError(): void {
      this.error = null;
    },
  },
});
