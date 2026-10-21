import { Router } from 'express';
import { agentController } from '../controllers/agent.controller.js';

const router = Router();

// ⚠️ Les routes littérales doivent être déclarées AVANT les routes paramétrées
// pour que "/sync" ne soit pas interprété comme un identifiant d'agent.
router.post('/sync', (req, res, next) => agentController.syncAgents(req, res, next));

router.get('/', (req, res, next) => agentController.getAgents(req, res, next));
router.get('/:id', (req, res, next) => agentController.getAgentById(req, res, next));
router.put('/:id', (req, res, next) => agentController.updateAgent(req, res, next));
router.patch('/:id/position', (req, res, next) => agentController.moveAgent(req, res, next));
router.delete('/:id', (req, res, next) => agentController.deleteAgent(req, res, next));

export default router;
