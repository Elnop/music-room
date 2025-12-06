/**
 * Spotify OAuth and API types
 */

// OAuth Flow Types
export interface SpotifyAuthInitiateDTO {
  // No body needed - state generated server-side
}

export interface SpotifyAuthCallbackDTO {
  code: string
  state: string
  error?: string
}

export interface SpotifyAuthResponse {
  authUrl: string
  state: string
}

export interface SpotifyConnectionStatus {
  connected: boolean
  spotifyUserId?: string
  scopes?: string[]
  expiresAt?: string
}

// Spotify Token Response (from Spotify API)
export interface SpotifyTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope: string
}

// Spotify User Profile (from Spotify API)
export interface SpotifyUserProfile {
  id: string
  display_name: string
  email?: string
  images?: Array<{ url: string }>
  country?: string
  product?: string // premium, free, etc.
}

// Spotify Search Types
export interface SpotifySearchQuery {
  q: string
  type: 'track' | 'album' | 'artist' | 'playlist'
  limit?: number
  offset?: number
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ name: string; id: string }>
  album: {
    name: string
    id: string
    images: Array<{ url: string; height: number; width: number }>
  }
  duration_ms: number
  uri: string
  preview_url: string | null
  external_urls: {
    spotify: string
  }
}

export interface SpotifySearchResponse {
  tracks?: {
    items: SpotifyTrack[]
    total: number
    limit: number
    offset: number
  }
}
