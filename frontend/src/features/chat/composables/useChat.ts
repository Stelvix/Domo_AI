import { ref } from 'vue';
import { chatApi } from '../services/chat.api';
import { useAgentStore } from '@/stores/agent.store';
import type { ChatMessage, Conversation } from '@/types/chat';

export function useChat() {
  const agentStore = useAgentStore();

  const conversations = ref<Conversation[]>([]);
  const activeConversationId = ref<string | null>(null);
  const messages = ref<ChatMessage[]>([]);
  const isGenerating = ref(false);
  const error = ref<string | null>(null);

  /**
   * Agent actuellement chargé dans la session de chat. Sert à réinitialiser
   * l'historique lorsque l'utilisateur ouvre le terminal d'un autre agent.
   */
  const loadedAgentId = ref<string | null>(null);

  let abortController: AbortController | null = null;

  /**
   * Réinitialise l'état local de la conversation (historique + sélection).
   */
  function resetSession() {
    conversations.value = [];
    activeConversationId.value = null;
    messages.value = [];
    error.value = null;
  }

  /**
   * Charge toutes les conversations de l'agent actif
   */
  async function loadConversations(agentId: string) {
    error.value = null;

    // Changement d'agent : on purge l'état précédent pour ne pas afficher
    // les messages d'un autre modèle.
    if (loadedAgentId.value !== null && loadedAgentId.value !== agentId) {
      resetSession();
    }
    loadedAgentId.value = agentId;

    try {
      const list = await chatApi.getConversations(agentId);
      conversations.value = list;

      if (list.length > 0) {
        const stillExists = list.some((conv) => conv.id === activeConversationId.value);
        if (!activeConversationId.value || !stillExists) {
          await selectConversation(list[0].id);
        }
      } else {
        activeConversationId.value = null;
        messages.value = [];
      }
    } catch (err: any) {
      error.value = err.message || 'Impossible de charger les conversations.';
      console.error('[useChat.loadConversations]', err);
    }
  }

  /**
   * Sélectionne une conversation et charge son historique
   */
  async function selectConversation(conversationId: string) {
    error.value = null;
    activeConversationId.value = conversationId;
    try {
      const conv = await chatApi.getConversationMessages(conversationId);
      messages.value = conv.messages || [];
    } catch (err: any) {
      error.value = err.message || 'Erreur lors du chargement des messages.';
      console.error('[useChat.selectConversation]', err);
    }
  }

  /**
   * Démarre une nouvelle conversation vierge
   */
  async function startNewConversation(agentId: string, title?: string) {
    error.value = null;
    try {
      const newConv = await chatApi.createConversation(agentId, title);
      conversations.value = [newConv, ...conversations.value];
      activeConversationId.value = newConv.id;
      messages.value = [];
      return newConv;
    } catch (err: any) {
      error.value = err.message || 'Impossible de créer la conversation.';
      console.error('[useChat.startNewConversation]', err);
      return null;
    }
  }

  /**
   * Envoie un message utilisateur avec streaming de la réponse assistant
   */
  async function sendMessage(agentId: string, content: string) {
    if (!content.trim() || isGenerating.value) return;

    error.value = null;
    isGenerating.value = true;
    agentStore.setAgentStatus(agentId, 'thinking');

    const tempUserMsgId = `temp-user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: tempUserMsgId,
      conversationId: activeConversationId.value || '',
      role: 'user',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    messages.value.push(userMessage);

    const tempAssistantMsgId = `temp-asst-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: tempAssistantMsgId,
      conversationId: activeConversationId.value || '',
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      isStreaming: true,
      reasoning: '',
    };
    messages.value.push(assistantMessage);

    abortController = new AbortController();

    await chatApi.streamChat({
      payload: {
        agentId,
        conversationId: activeConversationId.value || undefined,
        content: content.trim(),
      },
      signal: abortController.signal,
      onChunk: (chunk: string, conversationId: string) => {
        if (!activeConversationId.value) {
          activeConversationId.value = conversationId;
          userMessage.conversationId = conversationId;
          assistantMessage.conversationId = conversationId;
        }
        assistantMessage.content += chunk;
      },
      onThinking: (chunk: string) => {
        assistantMessage.reasoning = (assistantMessage.reasoning || '') + chunk;
      },
      onDone: async (_fullContent: string, conversationId: string) => {
        assistantMessage.isStreaming = false;
        isGenerating.value = false;
        agentStore.setAgentStatus(agentId, 'online');
        abortController = null;

        // Actualisation de la liste des conversations pour refléter le titre / mise à jour
        try {
          const list = await chatApi.getConversations(agentId);
          conversations.value = list;
        } catch (err: any) {
          console.error('[useChat.sendMessage.onDone]', err);
        }
        activeConversationId.value = conversationId;
      },
      onError: (err: Error) => {
        assistantMessage.isStreaming = false;
        isGenerating.value = false;
        error.value = err.message || 'Erreur pendant la génération de la réponse.';
        agentStore.setAgentStatus(agentId, 'online');
        abortController = null;
      },
    });
  }

  /**
   * Interrompt immédiatement la génération en cours
   */
  function stopGeneration() {
    if (abortController) {
      abortController.abort();
      abortController = null;
      isGenerating.value = false;
      const lastMsg = messages.value[messages.value.length - 1];
      if (lastMsg && lastMsg.isStreaming) {
        lastMsg.isStreaming = false;
      }
    }
  }

  /**
   * Supprime une conversation
   */
  async function removeConversation(conversationId: string) {
    try {
      await chatApi.deleteConversation(conversationId);
      conversations.value = conversations.value.filter((c) => c.id !== conversationId);
      if (activeConversationId.value === conversationId) {
        if (conversations.value.length > 0) {
          await selectConversation(conversations.value[0].id);
        } else {
          activeConversationId.value = null;
          messages.value = [];
        }
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la suppression.';
    }
  }

  return {
    conversations,
    activeConversationId,
    messages,
    isGenerating,
    error,
    loadedAgentId,
    resetSession,
    loadConversations,
    selectConversation,
    startNewConversation,
    sendMessage,
    stopGeneration,
    removeConversation,
  };
}
