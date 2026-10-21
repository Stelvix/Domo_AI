import { agentRepository } from '../repositories/agent.repository.js';
import { ollamaService } from './ollama.service.js';

export class AgentService {
  /**
   * Synchronise les modèles détectés dans Ollama avec la base SQLite
   */
  async syncAgentsWithOllama() {
    let ollamaModels = [];
    let isOllamaOnline = true;

    try {
      ollamaModels = await ollamaService.getLocalModels();
    } catch (err) {
      isOllamaOnline = false;
      console.warn(`[AgentService] Ollama indisponible lors de la synchronisation : ${err.message}`);
    }

    if (isOllamaOnline && ollamaModels.length > 0) {
      // Configuration d'une grille 4 colonnes par défaut pour le pixel art
      const GRID_COLUMNS = 4;

      for (let i = 0; i < ollamaModels.length; i++) {
        const model = ollamaModels[i];
        const modelName = model.name;

        const posX = i % GRID_COLUMNS;
        const posY = Math.floor(i / GRID_COLUMNS);

        // Détermination intelligente du rôle par défaut selon le nom du modèle
        let defaultRole = 'Assistant Polyvalent AOC';
        if (modelName.includes('coder') || modelName.includes('dev') || modelName.includes('deepseek')) {
          defaultRole = 'Développeur Full-Stack Senior';
        } else if (modelName.includes('math') || modelName.includes('phi')) {
          defaultRole = 'Analyste Données & Logique';
        } else if (modelName.includes('llama') || modelName.includes('mistral') || modelName.includes('gemma')) {
          defaultRole = 'Superviseur AOC Opérations';
        }

        const defaultPrompt = `Tu es un agent spécialisé au sein du bureau AOC (Agent Operations Center). Ton rôle : ${defaultRole}. Réponds avec rigueur, concision et structure.`;

        await agentRepository.upsertByModelName(modelName, {
          displayName: modelName.split(':')[0].toUpperCase(),
          role: defaultRole,
          systemPrompt: defaultPrompt,
          positionX: posX,
          positionY: posY,
          avatarSprite: `agent-${(i % 6) + 1}`,
        });
      }
    }

    return this.getAllAgents(ollamaModels, isOllamaOnline);
  }

  /**
   * Récupère la liste de tous les agents enrichis de leur statut d'activité
   */
  async getAllAgents(cachedModels = null, cachedOnlineStatus = null) {
    const agents = await agentRepository.findAll();

    let isOnline = cachedOnlineStatus;
    let models = cachedModels;

    if (isOnline === null) {
      try {
        models = await ollamaService.getLocalModels();
        isOnline = true;
      } catch {
        isOnline = false;
        models = [];
      }
    }

    const availableModelNames = new Set((models || []).map((m) => m.name));

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
            }
          : null,
      };
    });
  }

  /**
   * Récupère un agent par son identifiant avec vérification d'existence
   */
  async getAgentById(id) {
    const agent = await agentRepository.findById(id);
    if (!agent) {
      const err = new Error(`Agent avec l'identifiant "${id}" introuvable.`);
      err.statusCode = 404;
      throw err;
    }
    return agent;
  }

  /**
   * Met à jour la configuration d'un agent (rôle, position, sprite, prompt)
   */
  async updateAgent(id, updateData) {
    // Vérification de l'existence
    await this.getAgentById(id);

    // Filtrage des champs modifiables autorisés
    const allowedFields = ['displayName', 'role', 'systemPrompt', 'positionX', 'positionY', 'avatarSprite'];
    const sanitizedData = {};

    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        sanitizedData[key] = updateData[key];
      }
    }

    return agentRepository.update(id, sanitizedData);
  }
}

export const agentService = new AgentService();
