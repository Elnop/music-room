import crypto from 'crypto'
import { supabase } from '@/shared/config/supabase.js'
import { env } from '@/shared/config/env.js'
import { AppError } from '@/shared/middleware/error-handler.js'
import { logger } from '@/shared/utils/logger.js'
import type {
  SpotifyAuthResponse,
  SpotifyAuthCallbackDTO,
  SpotifyConnectionStatus,
  SpotifyTokenResponse,
  SpotifyUserProfile,
  SpotifySearchQuery,
  SpotifySearchResponse,
} from './spotify.types.js'

// OAuth state store (in-memory, expires after 10 minutes)
// In production, use Redis or database
const oauthStates = new Map<string, { userId: string; createdAt: number }>()

// Cleanup expired states every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [state, data] of oauthStates.entries()) {
    if (now - data.createdAt > 10 * 60 * 1000) {
      oauthStates.delete(state)
    }
  }
}, 5 * 60 * 1000)

export class SpotifyService {
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly redirectUri: string
  private readonly scopes = [
    'user-read-email',
    'user-read-private',
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-library-read',
    'user-library-modify',
  ]

  constructor() {
    if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) {
      logger.warn('Spotify credentials not configured - OAuth will not work')
    }
    this.clientId = env.SPOTIFY_CLIENT_ID || ''
    this.clientSecret = env.SPOTIFY_CLIENT_SECRET || ''
    this.redirectUri = env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/spotify/auth/callback'
  }

  /**
   * Initiate OAuth flow - generates authorization URL
   */
  async initiateAuth(userId: string): Promise<SpotifyAuthResponse> {
    if (!this.clientId) {
      throw new AppError(503, 'Spotify integration not configured', 'SPOTIFY_NOT_CONFIGURED')
    }

    // Generate random state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex')
    oauthStates.set(state, { userId, createdAt: Date.now() })

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      state,
      scope: this.scopes.join(' '),
      show_dialog: 'false', // Don't force approval if already authorized
    })

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`

    logger.info('Spotify OAuth initiated', { userId, state })

    return { authUrl, state }
  }

  /**
   * Handle OAuth callback - exchange code for tokens
   */
  async handleCallback(data: SpotifyAuthCallbackDTO): Promise<SpotifyConnectionStatus> {
    try {
      // Verify state
      const stateData = oauthStates.get(data.state)
      if (!stateData) {
        throw new AppError(400, 'Invalid or expired state parameter', 'INVALID_STATE')
      }

      const userId = stateData.userId
      oauthStates.delete(data.state) // Consume state

      // Check for error from Spotify
      if (data.error) {
        throw new AppError(400, `Spotify authorization failed: ${data.error}`, 'SPOTIFY_AUTH_ERROR')
      }

      // Exchange code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(data.code)

      // Get Spotify user profile
      const spotifyUser = await this.getSpotifyUserProfile(tokenResponse.access_token)

      // Calculate expiration
      const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000)

      // Save tokens to database
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          spotify_connected: true,
          spotify_user_id: spotifyUser.id,
          spotify_access_token: tokenResponse.access_token,
          spotify_refresh_token: tokenResponse.refresh_token,
          spotify_token_expires_at: expiresAt.toISOString(),
          spotify_scopes: tokenResponse.scope.split(' '),
        })
        .eq('id', userId)

      if (updateError) {
        logger.error('Failed to save Spotify tokens', { userId, error: updateError })
        throw new AppError(500, 'Failed to save Spotify connection', 'DB_ERROR')
      }

      logger.info('Spotify connected successfully', { userId, spotifyUserId: spotifyUser.id })

      return {
        connected: true,
        spotifyUserId: spotifyUser.id,
        scopes: tokenResponse.scope.split(' '),
        expiresAt: expiresAt.toISOString(),
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      logger.error('Spotify callback error', { error })
      throw new AppError(500, 'Failed to complete Spotify authorization', 'SPOTIFY_CALLBACK_ERROR')
    }
  }

  /**
   * Get Spotify connection status for user
   */
  async getConnectionStatus(userId: string): Promise<SpotifyConnectionStatus> {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('spotify_connected, spotify_user_id, spotify_scopes, spotify_token_expires_at')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      throw new AppError(404, 'User profile not found', 'PROFILE_NOT_FOUND')
    }

    return {
      connected: profile.spotify_connected,
      spotifyUserId: profile.spotify_user_id,
      scopes: profile.spotify_scopes,
      expiresAt: profile.spotify_token_expires_at,
    }
  }

  /**
   * Disconnect Spotify account
   */
  async disconnect(userId: string): Promise<void> {
    const { error } = await supabase.rpc('clear_spotify_connection', { user_id: userId })

    if (error) {
      logger.error('Failed to disconnect Spotify', { userId, error })
      throw new AppError(500, 'Failed to disconnect Spotify', 'DISCONNECT_ERROR')
    }

    logger.info('Spotify disconnected', { userId })
  }

  /**
   * Search Spotify catalog
   */
  async search(userId: string, query: SpotifySearchQuery): Promise<SpotifySearchResponse> {
    const accessToken = await this.getValidAccessToken(userId)

    const params = new URLSearchParams({
      q: query.q,
      type: query.type,
      limit: (query.limit || 20).toString(),
      offset: (query.offset || 0).toString(),
    })

    const response = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('Spotify search failed', { status: response.status, error })
      throw new AppError(response.status, 'Spotify search failed', 'SPOTIFY_SEARCH_ERROR')
    }

    return await response.json()
  }

  /**
   * Get valid access token (refresh if needed)
   */
  private async getValidAccessToken(userId: string): Promise<string> {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('spotify_access_token, spotify_refresh_token, spotify_token_expires_at, spotify_connected')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND')
    }

    if (!profile.spotify_connected || !profile.spotify_access_token) {
      throw new AppError(401, 'Spotify not connected', 'SPOTIFY_NOT_CONNECTED')
    }

    // Check if token expired
    const expiresAt = new Date(profile.spotify_token_expires_at)
    const now = new Date()

    // Refresh if expired or expires in next 5 minutes
    if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      return await this.refreshAccessToken(userId, profile.spotify_refresh_token)
    }

    return profile.spotify_access_token
  }

  /**
   * Refresh Spotify access token
   */
  private async refreshAccessToken(userId: string, refreshToken: string): Promise<string> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      logger.error('Failed to refresh Spotify token', { userId, status: response.status })
      throw new AppError(401, 'Failed to refresh Spotify token', 'TOKEN_REFRESH_ERROR')
    }

    const tokenData: Partial<SpotifyTokenResponse> = await response.json()
    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000)

    // Update database
    await supabase
      .from('user_profiles')
      .update({
        spotify_access_token: tokenData.access_token,
        spotify_token_expires_at: expiresAt.toISOString(),
      })
      .eq('id', userId)

    logger.info('Spotify token refreshed', { userId })

    return tokenData.access_token!
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<SpotifyTokenResponse> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('Failed to exchange code for tokens', { status: response.status, error })
      throw new AppError(400, 'Failed to exchange authorization code', 'TOKEN_EXCHANGE_ERROR')
    }

    return await response.json()
  }

  /**
   * Get Spotify user profile
   */
  private async getSpotifyUserProfile(accessToken: string): Promise<SpotifyUserProfile> {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      logger.error('Failed to fetch Spotify user profile', { status: response.status })
      throw new AppError(400, 'Failed to fetch Spotify profile', 'SPOTIFY_PROFILE_ERROR')
    }

    return await response.json()
  }
}
