import { conversationRepository } from '../repositories/conversation.repository.js';
import { agentRepository } from '../repositories/agent.repository.js';
import { ollamaService } from './ollama.service.js';

export class ChatService {
  /**
   * Récupère les conversations d'un agent
   */
  async getConversations(agentId) {
    return conversationRepository.findByAgentId(agentId);
  }

  /**
   * Récupère une conversation et tous ses messages
   */
  async getConversation(conversationId) {
    const conversation = await conversationRepository.findByIdWithMessages(conversationId);
    if (!conversation) {
      const err = new Error(`Conversation avec l'ID "${conversationId}" introuvable.`);
      err.statusCode = 404;
      throw err;
    }
    return conversation;
  }

  /**
   * Crée une nouvelle conversation pour un agent
   */
  async createConversation(agentId, title) {
    const agent = await agentRepository.findById(agentId);
    if (!agent) {
      const err = new Error(`Agent "${agentId}" introuvable.`);
      err.statusCode = 404;
      throw err;
    }

    const conversationTitle = title || `Discussion avec ${agent.displayName || agent.modelName}`;
    return conversationRepository.createConversation(agentId, conversationTitle);
  }

  /**
   * Orchestre l'envoi d'un message, l'injection du prompt système et le streaming de la réponse
   */
  async streamChatMessage({ agentId, conversationId, content, onChunk, onComplete, onError }) {
    try {
      const agent = await agentRepository.findById(agentId);
      if (!agent) {
        const err = new Error(`Agent avec l'ID "${agentId}" introuvable.`);
        err.statusCode = 404;
        throw err;
      }

      // Résolution ou création de la conversation
      let activeConversationId = conversationId;
      if (!activeConversationId) {
        const summaryTitle = content.length > 30 ? `${content.slice(0, 30)}...` : content;
        const newConv = await conversationRepository.createConversation(agentId, summaryTitle);
        activeConversationId = newConv.id;
      }

      // Enregistrement du message utilisateur
      await conversationRepository.createMessage(activeConversationId, 'user', content);

      // Récupération de l'historique récent (limité aux 20 derniers messages)
      const existingConv = await conversationRepository.findByIdWithMessages(activeConversationId);
      const pastMessages = (existingConv?.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Construction du contexte avec injection stricte du Prompt Système AOC / Rôle Métier
      const systemPrompt =
        agent.systemPrompt ||
        `Tu es ${agent.displayName || agent.modelName}, opérant au sein du centre d'opérations AOC. Rôle : ${agent.role || 'Assistant'}. Sois concis, précis et professionnel.`;

      const messagesForOllama = [
        { role: 'system', content: systemPrompt },
        ...pastMessages,
      ];

      // Appel au flux de streaming Ollama
      const stream = await ollamaService.chat({
        model: agent.modelName,
        messages: messagesForOllama,
        stream: true,
      });

      const reader = stream.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedAssistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const rawChunk = decoder.decode(value, { stream: true });
        // Les morceaux peuvent contenir plusieurs lignes NDJSON
        const lines = rawChunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) {
              accumulatedAssistantMessage += parsed.message.content;
              onChunk({
                chunk: parsed.message.content,
                conversationId: activeConversationId,
              });
            }
          } catch {
            // Ignorer les fragments JSON partiels
          }
        }
      }

      // Sauvegarde du message complet de l'assistant
      const savedAssistantMessage = await conversationRepository.createMessage(
        activeConversationId,
        'assistant',
        accumulatedAssistantMessage
      );

      onComplete({
        conversationId: activeConversationId,
        message: savedAssistantMessage,
        fullContent: accumulatedAssistantMessage,
      });
    } catch (err) {
      onError(err);
    }
  }

  /**
   * Supprime une conversation
   */
  async deleteConversation(conversationId) {
    return conversationRepository.deleteConversation(conversationId);
  }
}

export const chatService = new ChatService();
