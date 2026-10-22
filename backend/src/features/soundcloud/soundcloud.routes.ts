import { Router } from 'express';
import { authMiddleware } from '@/features/auth/auth.middleware.js';
import { soundcloudRateLimiter } from '@/features/auth/middleware/rate-limit.middleware.js';
import * as soundcloud from '@/features/soundcloud/soundcloud.controller.js';

// Endpoints are documented in soundcloud.openapi.ts.
const router = Router();

// Every route: signed-in users only, rate limited per user (Redis, fail closed).
// The limiter keys on req.user, so it runs after authMiddleware.
router.use(authMiddleware, soundcloudRateLimiter);

router.get('/search', soundcloud.search);
router.get('/track/:urlOrId', soundcloud.getTrack);
router.get('/stream', soundcloud.getStreamUrl);
router.get('/stream/:trackUrl', soundcloud.getStreamUrl);

export default router;
