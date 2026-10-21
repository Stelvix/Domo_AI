import { Router } from 'express';
import { ollamaService } from '../services/ollama.service.js';
import { agentRepository } from '../repositories/agent.repository.js';

const router = Router();

/**
 * GET /api/ollama/models
 * Liste les modèles installés dans Ollama et précise lesquels sont déjà
 * affectés à un agent du bureau (pour la création d'assistant depuis l'UI).
 */
router.get('/models', async (req, res, next) => {
  try {
    const [models, agents] = await Promise.all([
      ollamaService.getLocalModels(),
      agentRepository.findAll(),
    ]);

    const assignedModels = new Map(agents.map((agent) => [agent.modelName, agent.id]));

    res.status(200).json({
      success: true,
      count: models.length,
      data: models.map((model) => ({
        name: model.name,
        size: model.size,
        details: model.details ?? null,
        capabilities: model.capabilities ?? [],
        isAssigned: assignedModels.has(model.name),
        agentId: assignedModels.get(model.name) ?? null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
