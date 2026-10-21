import { chatService } from '../services/chat.service.js';
import { env } from '../config/env.js';

export class ChatController {
  /**
   * POST /api/chat
   * Envoi d'un message avec streaming Server-Sent Events (SSE)
   */
  async sendMessage(req, res, next) {
    const { agentId, conversationId, content } = req.body;

    if (!agentId || !content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        error: { message: 'Les paramètres "agentId" et "content" sont requis.' },
      });
    }

    // Configuration des en-têtes Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Pour éviter la mise en tampon par Nginx ou proxies
    res.flushHeaders?.();

    // Annulation de la génération lorsque le client ferme la connexion.
    // Attention : `req.on('close')` se déclenche dès que le corps de la requête
    // a été lu (Express le parse en JSON), il faut donc écouter la réponse.
    const abortController = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) {
        abortController.abort();
      }
    });

    // Keep-alive : maintient la connexion SSE ouverte pendant le chargement
    // du modèle (les modèles locaux peuvent mettre plusieurs minutes à répondre).
    const heartbeat = setInterval(() => {
      if (!res.writableEnded) {
        res.write(': heartbeat\n\n');
      }
    }, env.SSE_HEARTBEAT_INTERVAL_MS);

    const safeWrite = (payload) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    };

    try {
      await chatService.streamChatMessage({
        agentId,
        conversationId,
        content,
        signal: abortController.signal,
        onChunk: (data) => {
          safeWrite({ type: 'chunk', ...data });
        },
        onThinking: (data) => {
          safeWrite({ type: 'thinking', ...data });
        },
        onComplete: (data) => {
          clearInterval(heartbeat);
          safeWrite({ type: 'done', ...data });
          res.end();
        },
        onError: (err) => {
          clearInterval(heartbeat);
          console.error('[ChatController SSE Error]:', err.message);
          safeWrite({
            type: 'error',
            error: { message: err.message || 'Erreur pendant la génération du flux.' },
          });
          res.end();
        },
      });
    } catch (err) {
      clearInterval(heartbeat);
      next(err);
    } finally {
      clearInterval(heartbeat);
    }
  }

  /**
   * GET /api/chat/conversations/agent/:agentId
   */
  async getConversations(req, res, next) {
    try {
      const conversations = await chatService.getConversations(req.params.agentId);
      res.status(200).json({
        success: true,
        count: conversations.length,
        data: conversations,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/chat/conversations/:conversationId/messages
   */
  async getConversationMessages(req, res, next) {
    try {
      const conversation = await chatService.getConversation(req.params.conversationId);
      res.status(200).json({
        success: true,
        data: conversation,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/chat/conversations
   */
  async createConversation(req, res, next) {
    try {
      const { agentId, title } = req.body;
      if (!agentId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Le paramètre "agentId" est requis pour créer une conversation.' },
        });
      }
      const conversation = await chatService.createConversation(agentId, title);
      res.status(201).json({
        success: true,
        data: conversation,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/chat/conversations/:conversationId
   */
  async deleteConversation(req, res, next) {
    try {
      await chatService.deleteConversation(req.params.conversationId);
      res.status(200).json({
        success: true,
        message: 'Conversation supprimée avec succès.',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const chatController = new ChatController();
