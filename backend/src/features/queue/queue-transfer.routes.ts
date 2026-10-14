import { Router } from 'express';
import { queueController } from '@/features/queue/queue.controller.js';
import { authMiddleware } from '@/features/auth/auth.middleware.js';

// Separate from queue.routes.ts, which is also mounted under /api/users/:userId/queue:
// a transfer always starts from the caller (#295).
const router = Router();

router.use(authMiddleware);

/** POST /api/queue/transfer - move playback to a device of mine or of a friend */
router.post('/', (req, res, next) => queueController.transfer(req, res, next));

export default router;
