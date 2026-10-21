import { Router } from 'express';
import { agentController } from '../controllers/agent.controller.js';

const router = Router();

router.get('/', (req, res, next) => agentController.getAgents(req, res, next));
router.post('/sync', (req, res, next) => agentController.syncAgents(req, res, next));
router.get('/:id', (req, res, next) => agentController.getAgentById(req, res, next));
router.put('/:id', (req, res, next) => agentController.updateAgent(req, res, next));

export default router;
