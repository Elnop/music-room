// User Types (aligned with backend)
export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export interface UserProfile extends User {
  bio?: string;
  favorite_genres?: string[];
  privacy: {
    public: Record<string, unknown>;
    friends: Record<string, unknown>;
    private: Record<string, unknown>;
  };
}

// Auth Types (Supabase Auth v2.50.0+)
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: User;
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

// Playlist Types
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  visibility: 'public' | 'private';
  created_at: string;
  updated_at: string;
}

export interface Track {
  id: string;
  spotify_id: string;
  name: string;
  artist: string;
  album: string;
  duration_ms: number;
  album_art_url?: string;
  spotify_uri: string;
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
