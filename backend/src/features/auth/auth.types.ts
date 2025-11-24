/**
 * Data Transfer Objects (DTOs) for authentication
 */

export interface RegisterDTO {
  email: string
  password: string
  username: string
  displayName?: string
}

export interface LoginDTO {
  email: string
  password: string
}

export interface OAuthCallbackDTO {
  code: string
  state?: string
}

/**
 * Response types
 */

export interface UserProfile {
  id: string
  email: string
  username: string
  displayName?: string
  avatarUrl?: string
  bio?: string
  spotifyConnected: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: UserProfile
  session: {
    accessToken: string
    refreshToken: string
    expiresIn: number
    expiresAt: number
  }
}

export interface RefreshTokenDTO {
  refreshToken: string
}

/**
 * Supabase Auth User (minimal type for type safety)
 */
export interface SupabaseUser {
  id: string
  email: string
  role?: string
}
