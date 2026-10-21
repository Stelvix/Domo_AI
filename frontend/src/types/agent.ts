export type AgentStatus = 'online' | 'offline' | 'busy' | 'thinking';

export interface AgentMetadata {
  size?: number;
  parameterSize?: string;
  quantization?: string;
  family?: string;
}

export interface Agent {
  id: string;
  modelName: string;
  displayName: string | null;
  role: string | null;
  systemPrompt: string | null;
  positionX: number;
  positionY: number;
  avatarSprite: string | null;
  status: AgentStatus;
  metadata?: AgentMetadata | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    conversations: number;
  };
}

export interface UpdateAgentPayload {
  displayName?: string;
  role?: string;
  systemPrompt?: string;
  positionX?: number;
  positionY?: number;
  avatarSprite?: string;
}

/**
 * Payload de création d'un assistant depuis l'interface.
 */
export interface CreateAgentPayload {
  modelName: string;
  displayName?: string;
  role?: string;
  systemPrompt?: string;
  avatarSprite?: string;
  positionX?: number;
  positionY?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  count?: number;
  data: T;
  error?: {
    message: string;
    details?: unknown;
  };
}
