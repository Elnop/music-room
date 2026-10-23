import { Router } from 'express';
import * as queue from '@/features/queue/queue.controller.js';
import { authMiddleware } from '@/features/auth/auth.middleware.js';

// Not in queue.routes.ts, which is also mounted under /api/users/:userId/queue:
// a transfer always starts from the caller.
const router = Router();

router.use(authMiddleware);

router.post('/', queue.transfer);

export default router;
