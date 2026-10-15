import { Router } from 'express';
import { queueController } from '@/features/queue/queue.controller.js';
import { authMiddleware } from '@/features/auth/auth.middleware.js';

const router = Router({ mergeParams: true });

// All routes require authentication; they act on the caller's queue, or on
// `:userId`'s when mounted under /api/users/:userId/queue (#294).
router.use(authMiddleware);

/** GET /api/queue - the caller's queue */
router.get('/', (req, res, next) => queueController.getQueue(req, res, next));

/** POST /api/queue/items - append a track */
router.post('/items', (req, res, next) => queueController.addItem(req, res, next));

/** DELETE /api/queue/items/:itemId - remove an item (the current one acts as a skip) */
router.delete('/items/:itemId', (req, res, next) => queueController.removeItem(req, res, next));

/** POST /api/queue/items/:itemId/move - move an upcoming item */
router.post('/items/:itemId/move', (req, res, next) => queueController.moveItem(req, res, next));

/** POST /api/queue/items/:itemId/play - make an item current */
router.post('/items/:itemId/play', (req, res, next) => queueController.playItem(req, res, next));

/** POST /api/queue/playlists/:playlistId/play - play a playlist as a new block */
router.post('/playlists/:playlistId/play', (req, res, next) =>
	queueController.playPlaylist(req, res, next)
);

/** POST /api/queue/next - step to the next item */
router.post('/next', queueController.step('next'));

/** POST /api/queue/previous - step to the previous item */
router.post('/previous', queueController.step('previous'));

export default router;
