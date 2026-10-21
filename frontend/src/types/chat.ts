export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  isStreaming?: boolean;
  /** Raisonnement interne des modèles "thinking" (Qwen3, DeepSeek R1...). */
  reasoning?: string;
}

export interface Conversation {
  id: string;
  title: string;
  agentId: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

export interface SendMessagePayload {
  agentId: string;
  conversationId?: string;
  content: string;
}

export interface StreamChunkEvent {
  type: 'chunk';
  chunk: string;
  conversationId: string;
}

export interface StreamThinkingEvent {
  type: 'thinking';
  chunk: string;
  conversationId: string;
}

export interface StreamDoneEvent {
  type: 'done';
  conversationId: string;
  fullContent: string;
  thinking?: string;
  message: ChatMessage;
}

export interface StreamErrorEvent {
  type: 'error';
  error: {
    message: string;
  };
}

export type StreamEvent =
  | StreamChunkEvent
  | StreamThinkingEvent
  | StreamDoneEvent
  | StreamErrorEvent;
