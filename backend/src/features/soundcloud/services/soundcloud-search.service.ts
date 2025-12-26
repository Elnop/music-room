import { logger } from "@/shared/utils/logger.js";
import { AppError } from "@/shared/middleware/error-handler.js";
import { SoundCloudCache, CACHE_TTL } from "../utils/soundcloud-cache.js";
import type {
  SoundCloudClient,
  SoundCloudSearchQuery,
  SoundCloudSearchResult,
  SoundCloudTrack,
  TrackDTO,
} from "../soundcloud.types.js";

/**
 * Service for SoundCloud search and track retrieval
 */
export class SoundCloudSearchService {
  private soundcloud: SoundCloudClient;
  private cache: SoundCloudCache;

  constructor(soundcloudInstance: SoundCloudClient) {
    this.soundcloud = soundcloudInstance;
    this.cache = new SoundCloudCache();
  }

  /**
   * Search SoundCloud tracks
   */
  async searchTracks(
    query: SoundCloudSearchQuery,
  ): Promise<SoundCloudSearchResult> {
    const cacheKey = `search:${query.q}:${query.limit}:${query.offset}`;

    // Check cache
    const cached = this.cache.get<SoundCloudSearchResult>(cacheKey);
    if (cached) {
      logger.debug("Returning cached search results", { query: query.q });
      return cached;
    }

    try {
      logger.info("Searching SoundCloud", {
        query: query.q,
        limit: query.limit,
      });

      // soundcloud.ts search method
      const results = (await this.soundcloud.tracks.search({
        q: query.q,
        limit: query.limit,
        offset: query.offset,
      })) as {
        collection?: SoundCloudTrack[];
        total_results?: number;
        next_href?: string;
      };

      // Filter only playable/streamable tracks
      const playableTracks = (results.collection || []).filter((track) => {
        const hasStreamUrl =
          track.streamable ||
          (track.media?.transcodings && track.media.transcodings.length > 0);
        return hasStreamUrl;
      });

      const searchResult: SoundCloudSearchResult = {
        collection: playableTracks,
        total_results: results.total_results,
        next_href: results.next_href,
      };

      // Cache results
      this.cache.set(cacheKey, searchResult, CACHE_TTL.SEARCH);

      logger.info("Search completed", {
        query: query.q,
        totalFound: results.collection?.length || 0,
        playableCount: playableTracks.length,
      });

      return searchResult;
    } catch (error) {
      logger.error("SoundCloud search failed", { error, query: query.q });
      throw new AppError(
        500,
        "Failed to search SoundCloud",
        "SOUNDCLOUD_ERROR",
      );
    }
  }

  /**
   * Get track by URL or ID
   */
  async getTrack(urlOrId: string): Promise<SoundCloudTrack> {
    const cacheKey = `track:${urlOrId}`;
    const cached = this.cache.get<SoundCloudTrack>(cacheKey);
    if (cached) {
      logger.debug("Returning cached track", { urlOrId });
      return cached;
    }

    try {
      logger.info("Fetching track", { urlOrId });

      const track = (await this.soundcloud.tracks.get(
        urlOrId,
      )) as SoundCloudTrack;

      // Cache track details
      this.cache.set(cacheKey, track, CACHE_TTL.TRACK);

      return track;
    } catch (error) {
      logger.error("Failed to fetch track", { error, urlOrId });
      throw new AppError(404, "Track not found", "TRACK_NOT_FOUND");
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
      albumArt: track.artwork_url || track.user.avatar_url || "",
      durationMs: track.duration,
      trackUri: track.permalink_url,
      previewUrl: "", // Stream URL fetched separately via getStreamUrl()
    };
  }
}
