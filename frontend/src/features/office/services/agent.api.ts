import { apiClient } from '@/api/client';
import type { Agent, ApiResponse, UpdateAgentPayload } from '@/types/agent';

export const agentApi = {
  /**
   * Récupère la liste de tous les agents avec leurs statuts
   */
  async fetchAgents(): Promise<Agent[]> {
    const res = await apiClient.get<ApiResponse<Agent[]>>('/agents');
    return res.data;
  },

  /**
   * Récupère un agent par son identifiant
   */
  async fetchAgentById(id: string): Promise<Agent> {
    const res = await apiClient.get<ApiResponse<Agent>>(`/agents/${id}`);
    return res.data;
  },

  /**
   * Force la synchronisation avec le serveur Ollama local
   */
  async syncAgentsWithOllama(): Promise<Agent[]> {
    const res = await apiClient.post<ApiResponse<Agent[]>>('/agents/sync');
    return res.data;
  },

  /**
   * Met à jour la configuration d'un agent (rôle, position dans la grille, etc.)
   */
  async updateAgent(id: string, payload: UpdateAgentPayload): Promise<Agent> {
    const res = await apiClient.put<ApiResponse<Agent>>(`/agents/${id}`, payload);
    return res.data;
  },

  /**
   * Déplace un agent sur la grille pixel art (échange automatique si la case est occupée)
   */
  async moveAgent(id: string, positionX: number, positionY: number): Promise<Agent> {
    const res = await apiClient.patch<ApiResponse<Agent>>(`/agents/${id}/position`, {
      positionX,
      positionY,
    });
    return res.data;
  },

  /**
   * Retire un agent du bureau
   */
  async deleteAgent(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/agents/${id}`);
  },
};
