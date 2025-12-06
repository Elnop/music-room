import { config } from 'dotenv'
import { z } from 'zod'

config()

const envSchema = z.object({
  SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_KEY: z.string().min(1, 'Supabase service key is required'),
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:8081'),
  TUNNEL_URL: z.string().optional(), // Optional ngrok tunnel URL for cross-network development
  SPOTIFY_CLIENT_ID: z.string().optional(), // Optional for development without Spotify
  SPOTIFY_CLIENT_SECRET: z.string().optional(),
  SPOTIFY_REDIRECT_URI: z.string().url().optional(), // Manual override only - auto-configured by default
})

export type Env = z.infer<typeof envSchema>

const parseEnv = (): Env => {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    console.error('❌ Invalid environment variables:')
    console.error(result.error.format())
    process.exit(1)
  }

  return result.data
}

export const env = parseEnv()

/**
 * Smart Spotify redirect URI builder
 * Automatically constructs the correct redirect URI based on current mode:
 * - Manual override: Uses SPOTIFY_REDIRECT_URI if set
 * - Tunnel mode: Uses TUNNEL_URL when available
 * - LAN mode: Uses localhost with configured PORT
 */
export const getSpotifyRedirectUri = (): string => {
  // 1. Manual override takes precedence
  if (env.SPOTIFY_REDIRECT_URI) {
    return env.SPOTIFY_REDIRECT_URI
  }

  // 2. Tunnel mode - use tunnel URL
  if (env.TUNNEL_URL) {
    return `${env.TUNNEL_URL}/api/spotify/auth/callback`
  }

  // 3. Default - localhost for LAN mode
  return `http://localhost:${env.PORT}/api/spotify/auth/callback`
}
