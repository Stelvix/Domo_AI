import { conversationRepository } from '../repositories/conversation.repository.js';
import { agentRepository } from '../repositories/agent.repository.js';
import { ollamaService } from './ollama.service.js';
import { buildSystemPrompt } from '../config/prompts.js';
import { createNdjsonParser } from '../utils/ndjson.js';
import { env } from '../config/env.js';

export class ChatService {
  /**
   * Injection de dépendances : les tests unitaires peuvent fournir des doublures.
   * @param {{ conversationRepository?: object, agentRepository?: object, ollamaService?: object }} deps
   */
  constructor(deps = {}) {
    this.conversationRepository = deps.conversationRepository ?? conversationRepository;
    this.agentRepository = deps.agentRepository ?? agentRepository;
    this.ollamaService = deps.ollamaService ?? ollamaService;
  }

  /**
   * Récupère les conversations d'un agent
   */
  async getConversations(agentId) {
    return this.conversationRepository.findByAgentId(agentId);
  }

  /**
   * Récupère une conversation et tous ses messages
   */
  async getConversation(conversationId) {
    const conversation = await this.conversationRepository.findByIdWithMessages(conversationId);
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
    const agent = await this.agentRepository.findById(agentId);
    if (!agent) {
      const err = new Error(`Agent "${agentId}" introuvable.`);
      err.statusCode = 404;
      throw err;
    }

    const conversationTitle = title || `Discussion avec ${agent.displayName || agent.modelName}`;
    return this.conversationRepository.createConversation(agentId, conversationTitle);
  }

  /**
   * Supprime une conversation
   */
  async deleteConversation(conversationId) {
    return this.conversationRepository.deleteConversation(conversationId);
  }

  /**
   * Construit le contexte LLM : prompt système AOC + historique recent.
   * L'historique est volontairement tronqué pour éviter de saturer la fenêtre
   * de contexte des modèles locaux.
   */
  #buildContext(agent, messages) {
    const systemPrompt = buildSystemPrompt(agent);

    const history = messages
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .slice(-env.CHAT_HISTORY_LIMIT)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    return [
      { role: 'system', content: systemPrompt },
      ...history,
    ];
  }

  /**
   * Orchestre l'envoi d'un message, l'injection du prompt système et le streaming de la réponse.
   *
   * @param {{ agentId: string, conversationId?: string, content: string, signal?: AbortSignal,
   *           onChunk: (payload: {chunk: string, conversationId: string}) => void,
   *           onThinking?: (payload: {chunk: string, conversationId: string}) => void,
   *           onComplete: (payload: any) => void,
   *           onError: (error: Error) => void }} params
   */
  async streamChatMessage({
    agentId,
    conversationId,
    content,
    signal,
    onChunk,
    onThinking,
    onComplete,
    onError,
  }) {
    try {
      const agent = await this.agentRepository.findById(agentId);
      if (!agent) {
        const err = new Error(`Agent avec l'ID "${agentId}" introuvable.`);
        err.statusCode = 404;
        throw err;
      }

      // Résolution ou création de la conversation
      let activeConversationId = conversationId;
      if (!activeConversationId) {
        const summaryTitle = content.length > 30 ? `${content.slice(0, 30)}...` : content;
        const newConv = await this.conversationRepository.createConversation(agentId, summaryTitle);
        activeConversationId = newConv.id;
      }

      // Enregistrement du message utilisateur
      await this.conversationRepository.createMessage(activeConversationId, 'user', content);

      // Récupération de l'historique (le message utilisateur vient d'être ajouté)
      const existingConv = await this.conversationRepository.findByIdWithMessages(activeConversationId);
      const messagesForOllama = this.#buildContext(agent, existingConv?.messages || []);

      // Appel au flux de streaming Ollama
      const stream = await this.ollamaService.chat({
        model: agent.modelName,
        messages: messagesForOllama,
        stream: true,
        signal,
      });

      if (!stream) {
        throw new Error('Ollama n\'a pas renvoyé de flux de données exploitable.');
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder('utf-8');

      let accumulatedAssistantMessage = '';
      let accumulatedThinking = '';

      // Parseur NDJSON : tolère les objets JSON coupés par le réseau.
      const parser = createNdjsonParser((payload) => {
        const thinkingChunk = payload?.message?.thinking;
        if (thinkingChunk) {
          accumulatedThinking += thinkingChunk;
          onThinking?.({ chunk: thinkingChunk, conversationId: activeConversationId });
        }

        const contentChunk = payload?.message?.content;
        if (contentChunk) {
          accumulatedAssistantMessage += contentChunk;
          onChunk({ chunk: contentChunk, conversationId: activeConversationId });
        }
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        parser.push(decoder.decode(value, { stream: true }));
      }

      // Traite le dernier fragment éventuel (flux sans saut de ligne final)
      parser.push(decoder.decode());
      parser.flush();

      // Sauvegarde du message complet de l'assistant
      const savedAssistantMessage = await this.conversationRepository.createMessage(
        activeConversationId,
        'assistant',
        accumulatedAssistantMessage
      );

      onComplete({
        conversationId: activeConversationId,
        message: savedAssistantMessage,
        fullContent: accumulatedAssistantMessage,
        thinking: accumulatedThinking,
      });
    } catch (err) {
      // Une annulation utilisateur n'est pas une erreur applicative :
      // on la restitue au frontend avec un message explicite.
      if (err?.code === 'CLIENT_ABORTED' || err?.name === 'AbortError') {
        const abortedError = new Error('Génération interrompue par le client.');
        abortedError.statusCode = 499;
        abortedError.code = 'CLIENT_ABORTED';
        onError(abortedError);
        return;
      }
      onError(err);
    }
  }
}

export const chatService = new ChatService();
