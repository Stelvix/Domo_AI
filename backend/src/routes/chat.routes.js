import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';

const router = Router();

router.post('/', (req, res, next) => chatController.sendMessage(req, res, next));
router.get('/conversations/agent/:agentId', (req, res, next) => chatController.getConversations(req, res, next));
router.get('/conversations/:conversationId/messages', (req, res, next) => chatController.getConversationMessages(req, res, next));
router.post('/conversations', (req, res, next) => chatController.createConversation(req, res, next));
router.delete('/conversations/:conversationId', (req, res, next) => chatController.deleteConversation(req, res, next));

export default router;
