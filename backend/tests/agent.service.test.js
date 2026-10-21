import test from 'node:test';
import assert from 'node:assert/strict';
import { AgentService } from '../src/services/agent.service.js';

function createRepo(initialAgents = []) {
  const agents = [...initialAgents];
  let sequence = 0;

  return {
    agents,
    async findAll() {
      return agents.map((agent) => ({ ...agent }));
    },
    async findById(id) {
      const found = agents.find((agent) => agent.id === id);
      return found ? { ...found } : null;
    },
    async findByPosition(positionX, positionY) {
      const found = agents.find(
        (agent) => agent.positionX === positionX && agent.positionY === positionY
      );
      return found ? { ...found } : null;
    },
    async upsertByModelName(modelName, data) {
      const existing = agents.find((agent) => agent.modelName === modelName);
      if (existing) return { ...existing };
      sequence += 1;
      const created = { id: `agent-${sequence}`, modelName, ...data };
      agents.push(created);
      return { ...created };
    },
    async update(id, data) {
      const index = agents.findIndex((agent) => agent.id === id);
      agents[index] = { ...agents[index], ...data };
      return { ...agents[index] };
    },
    async delete(id) {
      const index = agents.findIndex((agent) => agent.id === id);
      const [removed] = agents.splice(index, 1);
      return removed;
    },
  };
}

test('agent : la synchronisation crée les nouveaux modèles sans écraser la configuration existante', async () => {
  const repo = createRepo([
    {
      id: 'agent-1',
      modelName: 'llama3:latest',
      displayName: 'MON LLAMA',
      role: 'Rôle personnalisé',
      systemPrompt: 'Prompt personnalisé',
      positionX: 3,
      positionY: 2,
      avatarSprite: 'agent-4',
    },
  ]);

  const service = new AgentService({
    agentRepository: repo,
    ollamaService: {
      getLocalModels: async () => [
        { name: 'llama3:latest', size: 100, details: {} },
        { name: 'qwen2.5-coder:7b', size: 200, details: {} },
      ],
      getRunningModels: async () => [],
    },
  });

  await service.syncAgentsWithOllama();

  const llama = repo.agents.find((a) => a.modelName === 'llama3:latest');
  assert.equal(llama.displayName, 'MON LLAMA');
  assert.equal(llama.role, 'Rôle personnalisé');
  assert.equal(llama.positionX, 3);
  assert.equal(llama.positionY, 2);
  assert.equal(llama.avatarSprite, 'agent-4');

  const qwen = repo.agents.find((a) => a.modelName === 'qwen2.5-coder:7b');
  assert.ok(qwen, 'Le nouveau modèle doit être importé');
  assert.equal(qwen.role, 'Développeur Full-Stack Senior');
});

test('agent : un nouveau modèle est placé sur un emplacement libre', async () => {
  const repo = createRepo([
    { id: 'agent-1', modelName: 'a:latest', positionX: 0, positionY: 0 },
    { id: 'agent-2', modelName: 'b:latest', positionX: 1, positionY: 0 },
  ]);

  const service = new AgentService({
    agentRepository: repo,
    ollamaService: {
      getLocalModels: async () => [{ name: 'c:latest', size: 1, details: {} }],
      getRunningModels: async () => [],
    },
  });

  await service.syncAgentsWithOllama();

  const created = repo.agents.find((a) => a.modelName === 'c:latest');
  assert.equal(created.positionX, 2);
  assert.equal(created.positionY, 0);
});

test('agent : le déplacement d’un agent échange les positions avec l’occupant', async () => {
  const repo = createRepo([
    { id: 'agent-1', modelName: 'a:latest', positionX: 0, positionY: 0 },
    { id: 'agent-2', modelName: 'b:latest', positionX: 1, positionY: 0 },
  ]);

  const service = new AgentService({ agentRepository: repo });

  await service.moveAgent('agent-1', 1, 0);

  assert.equal(repo.agents.find((a) => a.id === 'agent-1').positionX, 1);
  assert.equal(repo.agents.find((a) => a.id === 'agent-2').positionX, 0);
});

test('agent : le statut reflète la présence du modèle dans Ollama', async () => {
  const repo = createRepo([
    { id: 'agent-1', modelName: 'a:latest', positionX: 0, positionY: 0 },
    { id: 'agent-2', modelName: 'b:latest', positionX: 1, positionY: 0 },
  ]);

  const service = new AgentService({
    agentRepository: repo,
    ollamaService: {
      getLocalModels: async () => [{ name: 'a:latest', size: 42, details: { quantization_level: 'Q4' } }],
      getRunningModels: async () => ['a:latest'],
    },
  });

  const agents = await service.getAllAgents();

  assert.equal(agents[0].status, 'online');
  assert.equal(agents[0].metadata.isLoaded, true);
  assert.equal(agents[1].status, 'offline');
});

test('agent : les coordonnées hors bornes sont normalisées', async () => {
  const repo = createRepo([{ id: 'agent-1', modelName: 'a:latest', positionX: 0, positionY: 0 }]);
  const service = new AgentService({ agentRepository: repo });

  const moved = await service.moveAgent('agent-1', -5, 999);
  assert.equal(moved.positionX, 0);
  assert.equal(moved.positionY, 63);
});
