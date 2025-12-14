/**
 * SoundCloud Feature Types
 * Using soundcloud.ts package for API access
 */

/**
 * SoundCloud Track from API
 */
export interface SoundCloudTrack {
  id: number;
  title: string;
  description: string | null;
  duration: number; // milliseconds
  genre: string | null;
  artwork_url: string | null;
  permalink_url: string;
  user: {
    id: number;
    username: string;
    avatar_url: string | null;
    permalink_url: string;
  };
  stream_url?: string;
  streamable?: boolean;
  playable: boolean;
  media?: {
    transcodings: Array<{
      url: string;
      preset: string;
      format: {
        protocol: string;
        mime_type: string;
      };
    }>;
  };
}

/**
 * SoundCloud Search Response
 */
export interface SoundCloudSearchResult {
  collection: SoundCloudTrack[];
  total_results?: number;
  next_href?: string | null;
}

/**
 * SoundCloud Search Query DTO
 */
export interface SoundCloudSearchQuery {
  q: string; // search query
  limit?: number; // results per page (default: 20)
  offset?: number; // pagination offset
}

/**
 * Internal Track format (for adding to playlists)
 */
export interface TrackDTO {
  title: string;
  artist: string;
  album?: string; // Optional - SoundCloud doesn't have albums
  albumArt: string;
  durationMs: number;
  trackUri: string; // SoundCloud permalink_url
  previewUrl: string; // Stream URL (fetched separately)
}
