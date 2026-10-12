import { Router } from 'express';
import { authMiddleware } from '@/features/auth/auth.middleware.js';
import { soundcloudRateLimiter } from '@/features/auth/middleware/rate-limit.middleware.js';
import { SoundCloudController } from '@/features/soundcloud/soundcloud.controller.js';

const router = Router();
const controller = new SoundCloudController();

// Every route: signed-in users only, rate limited per user (Redis, fail closed).
// The limiter keys on req.user, so it runs after authMiddleware.
// Note: soundcloud.service.ts handles client_id extraction automatically
router.use(authMiddleware, soundcloudRateLimiter);

/**
 * Search SoundCloud tracks
 * GET /api/soundcloud/search?q=query&limit=20&offset=0
 */
router.get('/search', controller.search.bind(controller));

/**
 * Get track details by URL or ID
 * GET /api/soundcloud/track/:urlOrId
 */
router.get('/track/:urlOrId', controller.getTrack.bind(controller));

/**
 * Get stream URL for a track
 * GET /api/soundcloud/stream?url=<trackUrl>
 * Note: trackUrl should be URL-encoded as a query parameter
 * (Changed from path param to avoid Cloudflare WAF blocking URLs in paths)
 *
 * Legacy support: GET /api/soundcloud/stream/:trackUrl still works
 */
router.get('/stream', controller.getStreamUrl.bind(controller));
router.get('/stream/:trackUrl', controller.getStreamUrl.bind(controller));

export default router;
