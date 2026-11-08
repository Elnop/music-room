import { Router } from 'express';
import * as queue from '@/features/queue/queue.controller.js';
import { authMiddleware } from '@/features/auth/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', queue.transfer);

export default router;
