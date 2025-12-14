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
  private clientId: string | null = null;

  constructor() {
    // soundcloud.ts automatically extracts client_id from SoundCloud website
    // No credentials needed!
    logger.debug('Soundcloud module type:', typeof Soundcloud);
    logger.debug('Soundcloud module keys:', Object.keys(Soundcloud || {}));
    logger.debug('Soundcloud.default:', Soundcloud.default);
    logger.debug('Soundcloud.Soundcloud:', (Soundcloud as any).Soundcloud);

    const SoundcloudClass = (Soundcloud as any).default || (Soundcloud as any).Soundcloud || Soundcloud;
    this.soundcloud = new SoundcloudClass();

    // Try to extract client_id after initialization
    this.extractClientId();

    logger.info('SoundCloud service initialized (auto client_id extraction)');
  }

  private extractClientId() {
    // Log soundcloud instance structure for debugging
    logger.debug('🎵 [SoundCloud Service] Inspecting soundcloud instance', {
      keys: Object.keys(this.soundcloud),
      hasClientId: 'clientId' in this.soundcloud,
      hasClient_id: 'client_id' in this.soundcloud,
      hasOptions: 'options' in this.soundcloud,
      hasApi: 'api' in this.soundcloud,
      apiKeys: this.soundcloud.api ? Object.keys(this.soundcloud.api) : [],
      utilKeys: this.soundcloud.util ? Object.keys(this.soundcloud.util) : [],
    });

    // Try to get client_id from api.clientId property
    if (this.soundcloud.api?.clientId && typeof this.soundcloud.api.clientId === 'string') {
      this.clientId = this.soundcloud.api.clientId;
      logger.info('🟢 [SoundCloud Service] Client ID extracted from api.clientId', {
        clientIdPreview: this.clientId.substring(0, 10) + '...',
      });
      return;
    }

    // Try to call getClientId() method
    if (typeof this.soundcloud.api?.getClientId === 'function') {
      try {
        const id = this.soundcloud.api.getClientId();
        if (id && typeof id === 'string') {
          this.clientId = id;
          logger.info('🟢 [SoundCloud Service] Client ID extracted from api.getClientId()', {
            clientIdPreview: this.clientId.substring(0, 10) + '...',
          });
          return;
        }
      } catch (err) {
        logger.debug('Failed to call api.getClientId()', { error: err });
      }
    }

    logger.warn('🔴 [SoundCloud Service] Could not extract client_id from soundcloud instance');
    logger.debug('🎵 [SoundCloud Service] Soundcloud instance details', {
      type: typeof this.soundcloud,
      constructor: this.soundcloud?.constructor?.name,
      apiClientIdType: typeof this.soundcloud.api?.clientId,
      apiClientIdValue: this.soundcloud.api?.clientId,
    });
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
   * Uses soundcloud.ts util.streamLink() which handles everything internally
   */
  async getStreamUrl(trackUrl: string): Promise<string> {
    const cacheKey = `stream:${trackUrl}`;
    const cached = this.getCache<string>(cacheKey);
    if (cached) {
      logger.debug('🎵 [SoundCloud Service] Returning cached stream URL', {
        trackUrl,
        cachedUrlPreview: cached.substring(0, 100) + '...'
      });
      return cached;
    }

    try {
      logger.info('🎵 [SoundCloud Service] Getting stream URL', { trackUrl });

      // Check if util.streamLink() method is available
      if (typeof this.soundcloud.util?.streamLink !== 'function') {
        logger.error('🔴 [SoundCloud Service] util.streamLink() method not available');
        throw new AppError(500, 'SoundCloud API client not properly initialized', 'API_ERROR');
      }

      // Use soundcloud.ts util.streamLink() method
      // This method internally:
      // 1. Resolves the track (gets track details)
      // 2. Sorts transcodings by quality (AAC > MP3 > Opus)
      // 3. Resolves the transcoding URL to actual stream URL
      // We prefer HLS protocol for better streaming support
      logger.debug('🎵 [SoundCloud Service] Calling util.streamLink() with HLS protocol');

      const streamUrl = await this.soundcloud.util.streamLink(trackUrl, 'hls');

      // Validate the returned stream URL
      if (!streamUrl || typeof streamUrl !== 'string' || streamUrl.length === 0) {
        logger.warn('🔴 [SoundCloud Service] HLS stream not available, trying progressive');

        // Try progressive fallback
        const progressiveUrl = await this.soundcloud.util.streamLink(trackUrl, 'progressive');

        if (!progressiveUrl || typeof progressiveUrl !== 'string' || progressiveUrl.length === 0) {
          logger.error('🔴 [SoundCloud Service] No valid stream URL returned', {
            hlsResult: streamUrl,
            progressiveResult: progressiveUrl,
          });
          throw new AppError(404, 'Track stream not available', 'STREAM_NOT_FOUND');
        }

        logger.info('🟢 [SoundCloud Service] Stream URL obtained (progressive fallback)', {
          trackUrl,
          streamUrlLength: progressiveUrl.length,
          streamUrlPreview: progressiveUrl.substring(0, 100) + '...',
        });

        // Cache for 30 minutes (stream URLs can expire)
        this.setCache(cacheKey, progressiveUrl, 1800);
        return progressiveUrl;
      }

      logger.info('🟢 [SoundCloud Service] Stream URL obtained successfully (HLS)', {
        trackUrl,
        streamUrlLength: streamUrl.length,
        streamUrlPreview: streamUrl.substring(0, 100) + '...',
      });

      // Cache for 30 minutes (stream URLs can expire)
      this.setCache(cacheKey, streamUrl, 1800);

      return streamUrl;
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error('🔴 [SoundCloud Service] Failed to get stream URL', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        trackUrl,
      });

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
      album: undefined, // SoundCloud tracks don't have albums
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
