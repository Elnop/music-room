import { Request, Response, NextFunction } from 'express';
import { SoundCloudService } from './soundcloud.service.js';
import { soundcloudSearchSchema } from './soundcloud.validators.js';
import { logger } from '@/shared/utils/logger.js';

const soundcloudService = new SoundCloudService();

export class SoundCloudController {
  /**
   * Search tracks
   * GET /api/soundcloud/search?q=query&limit=20&offset=0
   */
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = soundcloudSearchSchema.parse(req.query);
      const results = await soundcloudService.searchTracks(query);

      return res.json({
        success: true,
        data: results,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get track details by URL or ID
   * GET /api/soundcloud/track/:urlOrId
   */
  async getTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { urlOrId } = req.params;

      if (!urlOrId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Track URL or ID is required',
            code: 'MISSING_TRACK_ID',
          },
          meta: { timestamp: new Date().toISOString() },
        });
      }

      const track = await soundcloudService.getTrack(urlOrId);

      return res.json({
        success: true,
        data: track,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get stream URL for a track
   * GET /api/soundcloud/stream/:trackUrl
   */
  async getStreamUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const trackUrl = decodeURIComponent(req.params.trackUrl);

      if (!trackUrl) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Track URL is required',
            code: 'MISSING_TRACK_URL',
          },
          meta: { timestamp: new Date().toISOString() },
        });
      }

      logger.info('Stream URL requested', { trackUrl });

      const streamUrl = await soundcloudService.getStreamUrl(trackUrl);

      return res.json({
        success: true,
        data: { streamUrl },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
}
