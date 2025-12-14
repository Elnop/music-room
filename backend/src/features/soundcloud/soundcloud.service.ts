import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const SoundcloudModule = require('soundcloud.ts');
const Soundcloud = SoundcloudModule.default || SoundcloudModule;

import { logger } from '@/shared/utils/logger.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import type {
  SoundCloudSearchQuery,
  SoundCloudSearchResult,
  SoundCloudTrack,
  TrackDTO,
} from './soundcloud.types.js';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class SoundCloudService {
  private soundcloud: any;
  private cache: Map<string, CacheEntry<any>> = new Map();

  constructor() {
    // soundcloud.ts automatically extracts client_id from SoundCloud website
    // No credentials needed!
    logger.debug('Soundcloud module type:', typeof Soundcloud);
    logger.debug('Soundcloud module keys:', Object.keys(Soundcloud || {}));
    logger.debug('Soundcloud.default:', Soundcloud.default);
    logger.debug('Soundcloud.Soundcloud:', (Soundcloud as any).Soundcloud);

    const SoundcloudClass = (Soundcloud as any).default || (Soundcloud as any).Soundcloud || Soundcloud;
    this.soundcloud = new SoundcloudClass();
    logger.info('SoundCloud service initialized (auto client_id extraction)');
  }

  /**
   * Search SoundCloud tracks
   */
  async searchTracks(query: SoundCloudSearchQuery): Promise<SoundCloudSearchResult> {
    const cacheKey = `search:${query.q}:${query.limit}:${query.offset}`;

    // Check cache (1 hour TTL)
    const cached = this.getCache<SoundCloudSearchResult>(cacheKey);
    if (cached) {
      logger.debug('Returning cached search results', { query: query.q });
      return cached;
    }

    try {
      logger.info('Searching SoundCloud', { query: query.q, limit: query.limit });

      // soundcloud.ts search method
      const results = await this.soundcloud.tracks.search({
        q: query.q,
        limit: query.limit,
        offset: query.offset,
      });

      // Filter only playable/streamable tracks
      const playableTracks = (results.collection || []).filter((track: any) => {
        const hasStreamUrl = track.streamable || track.media?.transcodings?.length > 0;
        return hasStreamUrl;
      });

      const searchResult: SoundCloudSearchResult = {
        collection: playableTracks,
        total_results: results.total_results,
        next_href: results.next_href,
      };

      // Cache results (1 hour = 3600 seconds)
      this.setCache(cacheKey, searchResult, 3600);

      logger.info('Search completed', {
        query: query.q,
        totalFound: results.collection?.length || 0,
        playableCount: playableTracks.length,
      });

      return searchResult;
    } catch (error) {
      logger.error('SoundCloud search failed', { error, query: query.q });
      throw new AppError(500, 'Failed to search SoundCloud', 'SOUNDCLOUD_ERROR');
    }
  }

  /**
   * Get track by URL or ID
   */
  async getTrack(urlOrId: string): Promise<SoundCloudTrack> {
    const cacheKey = `track:${urlOrId}`;
    const cached = this.getCache<SoundCloudTrack>(cacheKey);
    if (cached) {
      logger.debug('Returning cached track', { urlOrId });
      return cached;
    }

    try {
      logger.info('Fetching track', { urlOrId });

      const track = await this.soundcloud.tracks.get(urlOrId);

      // Cache for 1 hour
      this.setCache(cacheKey, track, 3600);

      return track;
    } catch (error) {
      logger.error('Failed to fetch track', { error, urlOrId });
      throw new AppError(404, 'Track not found', 'TRACK_NOT_FOUND');
    }
  }

  /**
   * Get stream URL for a track
   * Returns HLS AAC stream URL
   */
  async getStreamUrl(trackUrl: string): Promise<string> {
    const cacheKey = `stream:${trackUrl}`;
    const cached = this.getCache<string>(cacheKey);
    if (cached) {
      logger.debug('Returning cached stream URL', { trackUrl });
      return cached;
    }

    try {
      logger.info('Getting stream URL', { trackUrl });

      // Get track details first
      const track = await this.soundcloud.tracks.get(trackUrl);

      // Check if track is streamable
      if (!track.streamable && !track.media?.transcodings?.length) {
        logger.warn('Track is not streamable', { trackUrl, trackId: track.id });
        throw new AppError(403, 'Track is not streamable', 'NOT_STREAMABLE');
      }

      // Extract AAC HLS URL from media transcodings
      const aacTranscoding = track.media?.transcodings?.find(
        (t: any) =>
          t.format?.protocol === 'hls' && t.format?.mime_type?.includes('aac')
      );

      if (!aacTranscoding) {
        logger.warn('AAC HLS stream not found', { trackUrl, trackId: track.id });
        throw new AppError(404, 'Stream URL not available', 'STREAM_NOT_FOUND');
      }

      const streamUrl = aacTranscoding.url;

      // Cache for 30 minutes (stream URLs can expire)
      this.setCache(cacheKey, streamUrl, 1800);

      logger.info('Stream URL obtained', { trackUrl, trackId: track.id });
      return streamUrl;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get stream URL', { error, trackUrl });
      throw new AppError(500, 'Failed to get stream URL', 'STREAM_ERROR');
    }
  }

  /**
   * Convert SoundCloud track to internal Track format
   */
  convertToTrackDTO(track: SoundCloudTrack): TrackDTO {
    return {
      title: track.title,
      artist: track.user.username,
      album: track.genre || 'SoundCloud',
      albumArt: track.artwork_url || track.user.avatar_url || '',
      durationMs: track.duration,
      trackUri: track.permalink_url,
      previewUrl: '', // Stream URL fetched separately via getStreamUrl()
    };
  }

  /**
   * Get cached value if not expired
   */
  private getCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set cache with TTL in seconds
   */
  private setCache<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }
}
