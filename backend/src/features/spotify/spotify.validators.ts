import { z } from 'zod'

/**
 * Validation schemas for Spotify OAuth and API requests
 */

export const spotifyAuthCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State parameter is required'),
  error: z.string().optional(),
})

export const spotifySearchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200, 'Query too long'),
  type: z.enum(['track', 'album', 'artist', 'playlist']).default('track'),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
})

export type SpotifyAuthCallbackInput = z.infer<typeof spotifyAuthCallbackSchema>
export type SpotifySearchInput = z.infer<typeof spotifySearchSchema>
