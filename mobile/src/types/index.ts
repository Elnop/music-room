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
  spotifyConnected: boolean;
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
  duration: number; // milliseconds
  spotifyUri: string;
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
  trackIds: string[];
  visibility: 'public' | 'private';
  createdAt: string;
  updatedAt: string;
}

// Playlist with full track data and owner info
export interface PlaylistWithTracks extends Playlist {
  tracks: Track[];
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

// Spotify Types (aligned with backend)
export interface SpotifyConnectionStatus {
  connected: boolean;
  spotifyUserId?: string;
  scopes?: string[];
  expiresAt?: string;
}

export interface SpotifyAuthResponse {
  authUrl: string;
  state: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string; id: string }>;
  album: {
    name: string;
    id: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  duration_ms: number;
  uri: string;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifySearchResult {
  tracks?: {
    items: SpotifyTrack[];
    total: number;
    limit: number;
    offset: number;
  };
}
