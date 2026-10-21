import { apiClient } from '@/api/client';
import type { ApiResponse } from '@/types/agent';
import type { Conversation, SendMessagePayload, StreamEvent } from '@/types/chat';

export const chatApi = {
  /**
   * Récupère les conversations d'un agent
   */
  async getConversations(agentId: string): Promise<Conversation[]> {
    const res = await apiClient.get<ApiResponse<Conversation[]>>(`/chat/conversations/agent/${agentId}`);
    return res.data;
  },

  /**
   * Récupère une conversation spécifique et ses messages
   */
  async getConversationMessages(conversationId: string): Promise<Conversation> {
    const res = await apiClient.get<ApiResponse<Conversation>>(`/chat/conversations/${conversationId}/messages`);
    return res.data;
  },

  /**
   * Crée une nouvelle conversation pour un agent
   */
  async createConversation(agentId: string, title?: string): Promise<Conversation> {
    const res = await apiClient.post<ApiResponse<Conversation>>('/chat/conversations', { agentId, title });
    return res.data;
  },

  /**
   * Supprime une conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/chat/conversations/${conversationId}`);
  },

  /**
   * Envoi d'un message avec streaming Server-Sent Events (SSE)
   */
  async streamChat({
    payload,
    onChunk,
    onDone,
    onError,
    signal,
  }: {
    payload: SendMessagePayload;
    onChunk: (chunk: string, conversationId: string) => void;
    onDone: (fullContent: string, conversationId: string) => void;
    onError: (err: Error) => void;
    signal?: AbortSignal;
  }): Promise<void> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (!response.ok) {
        let errorMsg = `Erreur HTTP ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.error?.message) errorMsg = errData.error.message;
        } catch {
          // Fallback au statut HTTP
        }
        throw new Error(errorMsg);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Le flux de réponse ReadableStream est indisponible.');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Conserve la dernière ligne partielle

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const jsonStr = trimmed.slice(6);
          try {
            const event: StreamEvent = JSON.parse(jsonStr);

            if (event.type === 'chunk') {
              onChunk(event.chunk, event.conversationId);
            } else if (event.type === 'done') {
              onDone(event.fullContent, event.conversationId);
            } else if (event.type === 'error') {
              onError(new Error(event.error.message));
            }
          } catch {
            // Ignorer morceaux JSON partiels
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Requête annulée intentionnellement
      }
      onError(err);
    }
  },
};
