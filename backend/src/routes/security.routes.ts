import { Router } from 'express';
import { getSecurityEvents, getFileShardStates, simulateUnauthorizedAccess } from '../controllers/security.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/events', getSecurityEvents);
router.get('/files/:id/shards', getFileShardStates);
router.post('/files/:id/simulate-unauthorized-access', simulateUnauthorizedAccess);

export default router;
