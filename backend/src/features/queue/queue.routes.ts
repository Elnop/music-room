import { Router } from 'express';
import * as queue from '@/features/queue/queue.controller.js';
import { authMiddleware } from '@/features/auth/auth.middleware.js';

// Endpoints are documented in queue*.openapi.ts.
const router = Router({ mergeParams: true });

// All routes require authentication; they act on the caller's queue, or on
// `:userId`'s when mounted under /api/users/:userId/queue (#294).
router.use(authMiddleware);

router.get('/', queue.getQueue);
router.post('/items', queue.addItem);
router.delete('/items/:itemId', queue.removeItem);
router.post('/items/:itemId/move', queue.moveItem);
router.post('/items/:itemId/play', queue.playItem);
router.post('/playlists/:playlistId/play', queue.playPlaylist);
router.post('/next', queue.stepNext);
router.post('/previous', queue.stepPrevious);

export default router;
