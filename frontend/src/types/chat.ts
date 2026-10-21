export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  isStreaming?: boolean;
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

export interface StreamDoneEvent {
  type: 'done';
  conversationId: string;
  fullContent: string;
  message: ChatMessage;
}

export interface StreamErrorEvent {
  type: 'error';
  error: {
    message: string;
  };
}

export type StreamEvent = StreamChunkEvent | StreamDoneEvent | StreamErrorEvent;
