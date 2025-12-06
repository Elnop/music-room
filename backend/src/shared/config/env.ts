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
  SPOTIFY_REDIRECT_URI: z.string().url().optional().default('http://localhost:3000/api/spotify/auth/callback'),
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
