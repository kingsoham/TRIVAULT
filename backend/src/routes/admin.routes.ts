import { Router } from 'express';
import { resetSimulation } from '../controllers/admin.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Demonstration mode allows users to test reset, or admin role
router.post('/files/:id/reset-simulation', resetSimulation);

export default router;
