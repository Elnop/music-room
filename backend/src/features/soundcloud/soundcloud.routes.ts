import { Router } from 'express';
import { SoundCloudController } from './soundcloud.controller.js';

const router = Router();
const controller = new SoundCloudController();

// Public routes (no authentication required)
// Note: soundcloud.ts handles client_id extraction automatically

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
 * GET /api/soundcloud/stream/:trackUrl
 * Note: trackUrl should be URL-encoded
 */
router.get('/stream/:trackUrl', controller.getStreamUrl.bind(controller));

export { router as soundcloudRoutes };
