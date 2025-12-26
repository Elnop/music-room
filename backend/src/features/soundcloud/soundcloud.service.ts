import { createRequire } from "module";
const require = createRequire(import.meta.url);
const SoundcloudModule = require("soundcloud.ts");
const Soundcloud = SoundcloudModule.default || SoundcloudModule;

import { logger } from "@/shared/utils/logger.js";
import {
  extractClientId,
  initializeSoundcloudInstance,
} from "./utils/client-extractor.js";
import { SoundCloudSearchService } from "./services/soundcloud-search.service.js";
import { SoundCloudStreamService } from "./services/soundcloud-stream.service.js";
import type {
  SoundCloudClient,
  SoundCloudSearchQuery,
  SoundCloudSearchResult,
  SoundCloudTrack,
  TrackDTO,
} from "./soundcloud.types.js";

/**
 * Main SoundCloud service - orchestrates search and streaming operations
 */
export class SoundCloudService {
  private soundcloud: SoundCloudClient;
  private clientId: string | null = null;
  private searchService: SoundCloudSearchService;
  private streamService: SoundCloudStreamService;

  constructor() {
    // Initialize soundcloud.ts instance
    // The library automatically extracts client_id from SoundCloud website
    this.soundcloud = initializeSoundcloudInstance(Soundcloud);

    // Extract client_id (optional, for debugging)
    this.clientId = extractClientId(this.soundcloud);

    // Initialize sub-services
    this.searchService = new SoundCloudSearchService(this.soundcloud);
    this.streamService = new SoundCloudStreamService(this.soundcloud);

    logger.info("SoundCloud service initialized");
  }

  /**
   * Search SoundCloud tracks
   */
  async searchTracks(
    query: SoundCloudSearchQuery,
  ): Promise<SoundCloudSearchResult> {
    return this.searchService.searchTracks(query);
  }

  /**
   * Get track by URL or ID
   */
  async getTrack(urlOrId: string): Promise<SoundCloudTrack> {
    return this.searchService.getTrack(urlOrId);
  }

  /**
   * Get stream URL for a track
   */
  async getStreamUrl(trackUrl: string): Promise<string> {
    return this.streamService.getStreamUrl(trackUrl);
  }

  /**
   * Convert SoundCloud track to internal Track format
   */
  convertToTrackDTO(track: SoundCloudTrack): TrackDTO {
    return this.searchService.convertToTrackDTO(track);
  }
}
