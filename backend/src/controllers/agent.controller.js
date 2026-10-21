import { agentService } from '../services/agent.service.js';

export class AgentController {
  /**
   * GET /api/agents
   * Liste tous les agents enregistrés avec statut de disponibilité
   */
  async getAgents(req, res, next) {
    try {
      const agents = await agentService.getAllAgents();
      res.status(200).json({
        success: true,
        count: agents.length,
        data: agents,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/agents/:id
   * Détails d'un agent spécifique
   */
  async getAgentById(req, res, next) {
    try {
      const agent = await agentService.getAgentById(req.params.id);
      res.status(200).json({
        success: true,
        data: agent,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/agents/:id
   * Mise à jour de la configuration de l'agent (position, rôle, prompt, sprite)
   */
  async updateAgent(req, res, next) {
    try {
      const updatedAgent = await agentService.updateAgent(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Configuration de l’agent mise à jour avec succès.',
        data: updatedAgent,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/agents/sync
   * Déclenche la synchronisation avec Ollama pour importer automatiquement les modèles locaux
   */
  async syncAgents(req, res, next) {
    try {
      const agents = await agentService.syncAgentsWithOllama();
      res.status(200).json({
        success: true,
        message: 'Synchronisation avec Ollama effectuée.',
        count: agents.length,
        data: agents,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const agentController = new AgentController();
