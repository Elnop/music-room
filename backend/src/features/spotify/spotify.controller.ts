import type { Request, Response, NextFunction } from 'express'
import { SpotifyService } from './spotify.service.js'
import { spotifyAuthCallbackSchema, spotifySearchSchema } from './spotify.validators.js'
import type { ApiResponse } from '@/shared/types/global.types.js'
import type { AuthenticatedRequest } from '@/shared/types/global.types.js'

const spotifyService = new SpotifyService()

export class SpotifyController {
  /**
   * GET /api/spotify/auth/initiate
   * Initiate Spotify OAuth flow
   */
  async initiateAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest
      const result = await spotifyService.initiateAuth(authReq.user.id)

      const response: ApiResponse = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/spotify/auth/callback
   * Handle Spotify OAuth callback (web-based flow)
   */
  async handleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = spotifyAuthCallbackSchema.parse(req.query)
      const result = await spotifyService.handleCallback(validated)

      // Redirect to mobile deep link with success
      const deepLink = `musicroom://auth/spotify/callback?success=true&spotifyUserId=${result.spotifyUserId}`
      res.redirect(deepLink)
    } catch (error) {
      // Redirect to mobile deep link with error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const deepLink = `musicroom://auth/spotify/callback?success=false&error=${encodeURIComponent(errorMessage)}`
      res.redirect(deepLink)
    }
  }

  /**
   * POST /api/spotify/auth/exchange
   * Exchange authorization code for tokens (mobile flow)
   */
  async exchangeCode(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = spotifyAuthCallbackSchema.parse(req.body)
      const result = await spotifyService.handleCallback(validated)

      const response: ApiResponse = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/spotify/auth/status
   * Get Spotify connection status
   */
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest
      const result = await spotifyService.getConnectionStatus(authReq.user.id)

      const response: ApiResponse = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/spotify/auth/disconnect
   * Disconnect Spotify account
   */
  async disconnect(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest
      await spotifyService.disconnect(authReq.user.id)

      const response: ApiResponse = {
        success: true,
        data: { message: 'Spotify disconnected successfully' },
        meta: {
          timestamp: new Date().toISOString(),
        },
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/spotify/search
   * Search Spotify catalog
   */
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest
      const validated = spotifySearchSchema.parse({
        q: req.query.q,
        type: req.query.type,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      })

      const result = await spotifyService.search(authReq.user.id, validated)

      const response: ApiResponse = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }
}
