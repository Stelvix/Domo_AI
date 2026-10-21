import { agentRepository } from '../repositories/agent.repository.js';
import { ollamaService } from './ollama.service.js';
import { env } from '../config/env.js';

/**
 * Rôles métier proposés par défaut selon le nom du modèle Ollama.
 */
const ROLE_RULES = [
  { keywords: ['coder', 'code', 'dev', 'deepseek', 'starcoder'], role: 'Développeur Full-Stack Senior' },
  { keywords: ['math', 'phi', 'qwen', 'reason'], role: 'Analyste Données & Logique' },
  { keywords: ['llama', 'mistral', 'gemma'], role: 'Superviseur AOC Opérations' },
];

export class AgentService {
  /**
   * Injection de dépendances pour les tests unitaires.
   * @param {{ agentRepository?: object, ollamaService?: object }} deps
   */
  constructor(deps = {}) {
    this.agentRepository = deps.agentRepository ?? agentRepository;
    this.ollamaService = deps.ollamaService ?? ollamaService;
  }

  /**
   * Détermine le rôle métier par défaut d'un modèle.
   */
  static resolveDefaultRole(modelName) {
    const normalized = modelName.toLowerCase();
    const rule = ROLE_RULES.find((candidate) =>
      candidate.keywords.some((keyword) => normalized.includes(keyword))
    );
    return rule ? rule.role : 'Assistant Polyvalent AOC';
  }

  /**
   * Calcule le premier emplacement libre de la grille pixel art.
   * @param {Set<string>} occupiedSet Clés "x:y" déjà utilisées.
   * @param {number} columns Nombre de colonnes de la grille.
   */
  static findFreeSlot(occupiedSet, columns) {
    // Parcourt d'abord les lignes déjà entamées pour rester compact
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < columns; x++) {
        const key = `${x}:${y}`;
        if (!occupiedSet.has(key)) {
          occupiedSet.add(key);
          return { x, y };
        }
      }
    }
    return { x: 0, y: 0 };
  }

  /**
   * Synchronise les modèles détectés dans Ollama avec la base SQLite.
   *
   * - Les agents déjà connus conservent intégralement leur configuration
   *   (rôle, prompt système, position, sprite).
   * - Les nouveaux modèles sont importés dans les emplacements libres.
   */
  async syncAgentsWithOllama() {
    let ollamaModels = [];
    let isOllamaOnline = true;

    try {
      ollamaModels = await this.ollamaService.getLocalModels();
    } catch (err) {
      isOllamaOnline = false;
      console.warn(`[AgentService] Ollama indisponible lors de la synchronisation : ${err.message}`);
    }

    if (isOllamaOnline && ollamaModels.length > 0) {
      const existingAgents = await this.agentRepository.findAll();
      const knownModelNames = new Set(existingAgents.map((agent) => agent.modelName));

      // Emplacements déjà occupés par les agents existants
      const occupied = new Set(existingAgents.map((agent) => `${agent.positionX}:${agent.positionY}`));

      let spriteIndex = existingAgents.length;

      for (const model of ollamaModels) {
        const modelName = model.name;
        if (knownModelNames.has(modelName)) continue; // Agent déjà connu : configuration préservée

        const defaultRole = AgentService.resolveDefaultRole(modelName);
        const defaultPrompt = `Tu es un agent spécialisé au sein du bureau AOC (Agent Operations Center). Ton rôle : ${defaultRole}. Réponds avec rigueur, concision et structure.`;
        const slot = AgentService.findFreeSlot(occupied, env.OFFICE_GRID_COLUMNS);

        await this.agentRepository.upsertByModelName(modelName, {
          displayName: modelName.split(':')[0].toUpperCase(),
          role: defaultRole,
          systemPrompt: defaultPrompt,
          positionX: slot.x,
          positionY: slot.y,
          avatarSprite: `agent-${(spriteIndex % 6) + 1}`,
        });

        spriteIndex += 1;
      }
    }

    return this.getAllAgents(ollamaModels, isOllamaOnline);
  }

  /**
   * Récupère la liste de tous les agents enrichis de leur statut d'activité.
   */
  async getAllAgents(cachedModels = null, cachedOnlineStatus = null) {
    const agents = await this.agentRepository.findAll();

    let isOnline = cachedOnlineStatus;
    let models = cachedModels;

    if (isOnline === null) {
      try {
        models = await this.ollamaService.getLocalModels();
        isOnline = true;
      } catch {
        isOnline = false;
        models = [];
      }
    }

    const availableModelNames = new Set((models || []).map((m) => m.name));
    const loadedModelNames = new Set(await this.ollamaService.getRunningModels());

    return agents.map((agent) => {
      const isAvailableInOllama = isOnline && availableModelNames.has(agent.modelName);
      const modelMeta = (models || []).find((m) => m.name === agent.modelName);

      return {
        ...agent,
        status: isAvailableInOllama ? 'online' : 'offline',
        metadata: modelMeta
          ? {
              size: modelMeta.size,
              parameterSize: modelMeta.details?.parameter_size,
              quantization: modelMeta.details?.quantization_level,
              family: modelMeta.details?.family,
              isLoaded: loadedModelNames.has(agent.modelName),
            }
          : null,
      };
    });
  }

  /**
   * Récupère un agent par son identifiant avec vérification d'existence
   */
  async getAgentById(id) {
    const agent = await this.agentRepository.findById(id);
    if (!agent) {
      const err = new Error(`Agent avec l'identifiant "${id}" introuvable.`);
      err.statusCode = 404;
      throw err;
    }
    return agent;
  }

  /**
   * Met à jour la configuration d'un agent (rôle, position, sprite, prompt).
   * Seuls les champs explicitement autorisés sont persistés.
   */
  async updateAgent(id, updateData) {
    await this.getAgentById(id);

    const allowedFields = ['displayName', 'role', 'systemPrompt', 'positionX', 'positionY', 'avatarSprite'];
    const sanitizedData = {};

    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        sanitizedData[key] = updateData[key];
      }
    }

    if (sanitizedData.positionX !== undefined || sanitizedData.positionY !== undefined) {
      const current = await this.agentRepository.findById(id);
      sanitizedData.positionX = this.#sanitizePosition(sanitizedData.positionX ?? current.positionX);
      sanitizedData.positionY = this.#sanitizePosition(sanitizedData.positionY ?? current.positionY);
    }

    return this.agentRepository.update(id, sanitizedData);
  }

  /**
   * Déplace un agent sur la grille pixel art.
   * Si la case visée est déjà occupée, les deux agents échangeent leur position.
   */
  async moveAgent(id, positionX, positionY) {
    const agent = await this.getAgentById(id);
    const targetX = this.#sanitizePosition(positionX);
    const targetY = this.#sanitizePosition(positionY);

    if (targetX === agent.positionX && targetY === agent.positionY) {
      return agent;
    }

    const occupant = await this.agentRepository.findByPosition(targetX, targetY);

    if (occupant && occupant.id !== id) {
      // Échange des positions avec l'occupant de la case
      await this.agentRepository.update(occupant.id, {
        positionX: agent.positionX,
        positionY: agent.positionY,
      });
    }

    return this.agentRepository.update(id, { positionX: targetX, positionY: targetY });
  }

  /**
   * Supprime un agent (et ses conversations, en cascade).
   */
  async deleteAgent(id) {
    await this.getAgentById(id);
    return this.agentRepository.delete(id);
  }

  /**
   * Crée un nouvel assistant depuis l'interface.
   *
   * Le modèle doit être installé dans Ollama et ne pas être déjà affecté à un
   * agent (contrainte d'unicité sur `modelName`). La position est attribuée
   * automatiquement sur le premier bureau libre si elle n'est pas fournie.
   *
   * @param {{ modelName: string, displayName?: string, role?: string, systemPrompt?: string,
   *           avatarSprite?: string, positionX?: number, positionY?: number }} payload
   */
  async createAgent(payload = {}) {
    const modelName = typeof payload.modelName === 'string' ? payload.modelName.trim() : '';

    if (!modelName) {
      const err = new Error('Le champ "modelName" est requis pour créer un assistant.');
      err.statusCode = 400;
      throw err;
    }

    // Le modèle doit exister dans Ollama pour éviter de créer un agent inutilisable.
    let ollamaModels = [];
    try {
      ollamaModels = await this.ollamaService.getLocalModels();
    } catch (err) {
      const unavailable = new Error(
        `Impossible de vérifier les modèles Ollama : ${err.message}. Créez l'assistant après le démarrage d'Ollama.`
      );
      unavailable.statusCode = 503;
      unavailable.code = 'OLLAMA_UNAVAILABLE';
      throw unavailable;
    }

    const availableModel = ollamaModels.find((model) => model.name === modelName);
    if (!availableModel) {
      const err = new Error(
        `Le modèle "${modelName}" n'est pas installé dans Ollama. Utilisez "ollama pull ${modelName}" puis synchronisez.`
      );
      err.statusCode = 400;
      throw err;
    }

    // Unicité : un seul agent par modèle (contrainte de base de données).
    const existing = await this.agentRepository.findByModelName(modelName);
    if (existing) {
      const err = new Error(
        `Le modèle "${modelName}" est déjà affecté à l'assistant "${existing.displayName || existing.modelName}". Modifiez-le plutôt que d'en créer un second.`
      );
      err.statusCode = 409;
      err.code = 'MODEL_ALREADY_ASSIGNED';
      throw err;
    }

    const agents = await this.agentRepository.findAll();
    const occupied = new Set(agents.map((agent) => `${agent.positionX}:${agent.positionY}`));

    const hasCustomPosition =
      Number.isInteger(payload.positionX) && Number.isInteger(payload.positionY);

    const position = hasCustomPosition
      ? {
          x: this.#sanitizePosition(payload.positionX),
          y: this.#sanitizePosition(payload.positionY),
        }
      : AgentService.findFreeSlot(occupied, env.OFFICE_GRID_COLUMNS);

    const defaultRole = AgentService.resolveDefaultRole(modelName);
    const finalRole = payload.role?.trim() || defaultRole;

    return this.agentRepository.create({
      modelName,
      displayName: payload.displayName?.trim() || modelName.split(':')[0].toUpperCase(),
      role: finalRole,
      systemPrompt:
        payload.systemPrompt?.trim() ||
        `Tu es un agent spécialisé au sein du bureau AOC (Agent Operations Center). Ton rôle : ${finalRole}. Réponds avec rigueur, concision et structure.`,
      avatarSprite: payload.avatarSprite || 'agent-1',
      positionX: position.x,
      positionY: position.y,
    });
  }

  /**
   * Normalise une coordonnée de grille (entier positif borné).
   */
  #sanitizePosition(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.min(parsed, 63);
  }
}

export const agentService = new AgentService();
