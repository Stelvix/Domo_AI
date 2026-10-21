import { apiClient } from '@/api/client';
import type { Agent, ApiResponse, CreateAgentPayload } from '@/types/agent';

export interface OllamaModel {
  name: string;
  size: number;
  details: {
    parameter_size?: string;
    quantization_level?: string;
    family?: string;
    format?: string;
  } | null;
  capabilities: string[];
  isAssigned: boolean;
  agentId: string | null;
}

export const ollamaApi = {
  /**
   * Liste les modèles installés dans Ollama avec leur état d'affectation
   */
  async fetchModels(): Promise<OllamaModel[]> {
    const res = await apiClient.get<ApiResponse<OllamaModel[]>>('/ollama/models');
    return res.data;
  },

  /**
   * Crée un nouvel assistant sur le bureau
   */
  async createAgent(payload: CreateAgentPayload): Promise<Agent> {
    const res = await apiClient.post<ApiResponse<Agent>>('/agents', payload);
    return res.data;
  },
};
