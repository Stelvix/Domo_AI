import test from 'node:test';
import assert from 'node:assert/strict';
import { ChatService } from '../src/services/chat.service.js';

/**
 * Doublure d'un flux Ollama (ReadableStream) produisant des fragments NDJSON.
 */
function createMockStream(chunks) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

function createDeps(overrides = {}) {
  const messages = [];
  const conversations = [];

  return {
    agent: {
      id: 'agent-1',
      modelName: 'llama3:latest',
      displayName: 'LLAMA3',
      role: 'Développeur Senior',
      systemPrompt: 'Sois concis.',
    },
    conversation: { id: 'conv-1', agentId: 'agent-1', title: 'Test', messages: [] },
    messages,
    conversations,
    agentRepository: {
      findById: async () => overrides.agent ?? {
        id: 'agent-1',
        modelName: 'llama3:latest',
        displayName: 'LLAMA3',
        role: 'Développeur Senior',
        systemPrompt: 'Sois concis.',
      },
    },
    conversationRepository: {
      createConversation: async (agentId, title) => {
        const conv = { id: 'conv-1', agentId, title };
        conversations.push(conv);
        return conv;
      },
      createMessage: async (conversationId, role, content) => {
        const message = { id: `msg-${messages.length + 1}`, conversationId, role, content };
        messages.push(message);
        return message;
      },
      findByIdWithMessages: async () => ({
        id: 'conv-1',
        agentId: 'agent-1',
        title: 'Test',
        messages: [...messages],
      }),
      findByAgentId: async () => conversations,
      deleteConversation: async () => ({}),
    },
    ollamaService: {
      chat: async () =>
        createMockStream([
          '{"message":{"role":"assistant","content":"Bonjour"}}\n',
          '{"message":{"role":"assistant","content":" le monde"}}',
        ]),
    },
  };
}

test('chat : diffuse les chunks et persiste le message assistant', async () => {
  const deps = createDeps();
  const service = new ChatService({
    agentRepository: deps.agentRepository,
    conversationRepository: deps.conversationRepository,
    ollamaService: deps.ollamaService,
  });

  const chunks = [];
  let donePayload = null;

  await service.streamChatMessage({
    agentId: 'agent-1',
    content: 'Salut',
    onChunk: ({ chunk }) => chunks.push(chunk),
    onComplete: (payload) => {
      donePayload = payload;
    },
    onError: (err) => assert.fail(`Erreur inattendue : ${err.message}`),
  });

  assert.equal(chunks.join(''), 'Bonjour le monde');
  assert.equal(donePayload.fullContent, 'Bonjour le monde');
  assert.equal(donePayload.conversationId, 'conv-1');

  const assistantMessages = deps.messages.filter((m) => m.role === 'assistant');
  assert.equal(assistantMessages.length, 1);
  assert.equal(assistantMessages[0].content, 'Bonjour le monde');
});

test('chat : le prompt système AOC et le rôle métier sont injectés dans le contexte', async () => {
  const deps = createDeps();
  let capturedMessages = null;

  const service = new ChatService({
    agentRepository: deps.agentRepository,
    conversationRepository: deps.conversationRepository,
    ollamaService: {
      chat: async ({ messages }) => {
        capturedMessages = messages;
        return createMockStream(['{"message":{"content":"ok"}}\n']);
      },
    },
  });

  await service.streamChatMessage({
    agentId: 'agent-1',
    content: 'Salut',
    onChunk: () => {},
    onComplete: () => {},
    onError: (err) => assert.fail(err.message),
  });

  assert.equal(capturedMessages[0].role, 'system');
  assert.match(capturedMessages[0].content, /Agent Operations Center/);
  assert.match(capturedMessages[0].content, /Développeur Senior/);
  assert.match(capturedMessages[0].content, /Sois concis\./);
});

test('chat : le raisonnement des modèles "thinking" est diffusé séparément', async () => {
  const deps = createDeps();
  const service = new ChatService({
    agentRepository: deps.agentRepository,
    conversationRepository: deps.conversationRepository,
    ollamaService: {
      chat: async () =>
        createMockStream([
          '{"message":{"thinking":"je réfléchis"}}\n',
          '{"message":{"content":"Réponse"}}\n',
        ]),
    },
  });

  const thinking = [];
  const content = [];

  await service.streamChatMessage({
    agentId: 'agent-1',
    content: 'Salut',
    onChunk: ({ chunk }) => content.push(chunk),
    onThinking: ({ chunk }) => thinking.push(chunk),
    onComplete: () => {},
    onError: (err) => assert.fail(err.message),
  });

  assert.equal(thinking.join(''), 'je réfléchis');
  assert.equal(content.join(''), 'Réponse');
});

test('chat : un agent inexistant remonte une erreur 404', async () => {
  const deps = createDeps();
  const service = new ChatService({
    agentRepository: { findById: async () => null },
    conversationRepository: deps.conversationRepository,
    ollamaService: deps.ollamaService,
  });

  await new Promise((resolve) => {
    service.streamChatMessage({
      agentId: 'inconnu',
      content: 'Salut',
      onChunk: () => {},
      onComplete: () => {},
      onError: (err) => {
        assert.equal(err.statusCode, 404);
        resolve();
      },
    });
  });
});

test('chat : l’historique est tronqué pour ne pas saturer le contexte', async () => {
  const deps = createDeps();
  let capturedMessages = null;

  const service = new ChatService({
    agentRepository: deps.agentRepository,
    conversationRepository: {
      ...deps.conversationRepository,
      createMessage: async () => ({}),
      findByIdWithMessages: async () => ({
        id: 'conv-1',
        messages: Array.from({ length: 60 }, (_, index) => ({
          role: index % 2 === 0 ? 'user' : 'assistant',
          content: `message-${index}`,
        })),
      }),
    },
    ollamaService: {
      chat: async ({ messages }) => {
        capturedMessages = messages;
        return createMockStream([]);
      },
    },
  });

  await service.streamChatMessage({
    agentId: 'agent-1',
    content: 'Salut',
    onChunk: () => {},
    onComplete: () => {},
    onError: () => {},
  });

  // 1 message système + 20 messages d'historique (CHAT_HISTORY_LIMIT)
  assert.equal(capturedMessages.length, 21);
  assert.equal(capturedMessages.at(-1).content, 'message-59');
});
