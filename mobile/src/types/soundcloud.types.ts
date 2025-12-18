// SoundCloud Types
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
}

export interface SoundCloudSearchResult {
  collection: SoundCloudTrack[];
  total_results?: number;
  next_href?: string | null;
}
