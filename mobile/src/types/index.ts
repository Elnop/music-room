// User Types (aligned with backend)
export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface UserProfile extends User {
  displayName?: string;
  bio?: string;
  updatedAt: string;
}

// Auth Types (Supabase Auth v2.50.0+)
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: User;
}

// Backend Auth Session Response
export interface BackendAuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
}

// Track Types (Mock-friendly structure)
export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  durationMs: number; // milliseconds
  trackUri: string; // Universal track identifier (SoundCloud permalink, etc.)
  previewUrl?: string;
}

// Playlist Types (Mock-friendly structure)
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  ownerId: string;
  collaboratorIds: string[];
  trackCount: number;
  visibility: 'public' | 'private';
  createdAt: string;
  updatedAt: string;
}

// Track with position metadata (from playlist_tracks table)
export interface TrackWithPosition extends Track {
  position: number;
  addedBy: string | null;
  addedAt: string;
}

// Playlist with full track data and owner info
export interface PlaylistWithTracks extends Omit<Playlist, 'trackCount'> {
  tracks: TrackWithPosition[];
  owner: UserProfile;
}

// Device Types
export interface Device {
  id: string;
  user_id: string;
  name: string;
  type: string;
  created_at: string;
}

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

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}
