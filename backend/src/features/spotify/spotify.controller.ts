import type { Request, Response, NextFunction } from 'express'
import { SpotifyService } from './spotify.service.js'
import { spotifyAuthCallbackSchema, spotifySearchSchema } from './spotify.validators.js'
import type { ApiResponse } from '@/shared/types/global.types.js'
import type { AuthenticatedRequest } from '@/shared/types/global.types.js'

const spotifyService = new SpotifyService()

/**
 * Generate success HTML page that auto-closes the browser
 */
function getSuccessHtml(spotifyUserId: string): string {
  const deepLink = `musicroom://auth/spotify/callback?success=true&spotifyUserId=${spotifyUserId}`

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Music Room - Connected to Spotify</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
      }
      .container {
        text-align: center;
        color: white;
        padding: 40px;
        max-width: 400px;
      }
      h1 {
        font-size: 28px;
        margin-bottom: 20px;
        font-weight: 600;
      }
      .checkmark {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 30px;
        animation: scale-in 0.3s ease-out;
      }
      .checkmark svg {
        width: 50px;
        height: 50px;
        stroke: #1DB954;
        stroke-width: 3;
        stroke-linecap: round;
        stroke-linejoin: round;
        fill: none;
        animation: draw 0.5s ease-out 0.2s forwards;
        stroke-dasharray: 100;
        stroke-dashoffset: 100;
      }
      @keyframes scale-in {
        from { transform: scale(0); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      @keyframes draw {
        to { stroke-dashoffset: 0; }
      }
      p {
        font-size: 16px;
        opacity: 0.9;
        margin-bottom: 30px;
      }
      .close-btn {
        background: white;
        color: #1DB954;
        border: none;
        padding: 12px 32px;
        border-radius: 24px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        display: none;
        transition: transform 0.2s;
      }
      .close-btn:hover {
        transform: scale(1.05);
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="checkmark">
        <svg viewBox="0 0 52 52">
          <polyline points="14 27 22 35 38 19" />
        </svg>
      </div>
      <h1>Successfully Connected!</h1>
      <p>Your Spotify account is now linked to Music Room.</p>
      <button class="close-btn" onclick="window.close()">Close this window</button>
    </div>
    <script>
      // Trigger deep link to return to app
      window.location.href = '${deepLink}';

      // Auto-close after 1.5 seconds
      setTimeout(() => {
        try {
          window.close();
        } catch (e) {
          // If auto-close fails, show manual close button
          document.querySelector('.close-btn').style.display = 'inline-block';
        }
      }, 1500);
    </script>
  </body>
</html>`
}

/**
 * Generate error HTML page
 */
function getErrorHtml(errorMessage: string): string {
  const deepLink = `musicroom://auth/spotify/callback?success=false&error=${encodeURIComponent(errorMessage)}`

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Music Room - Connection Failed</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        background: #191414;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        color: white;
      }
      .container {
        text-align: center;
        padding: 40px;
        max-width: 400px;
      }
      h1 {
        font-size: 28px;
        margin-bottom: 20px;
        font-weight: 600;
        color: #ff4444;
      }
      .error-icon {
        font-size: 60px;
        margin-bottom: 20px;
      }
      p {
        font-size: 16px;
        opacity: 0.8;
        margin-bottom: 30px;
      }
      .error-message {
        background: rgba(255, 68, 68, 0.1);
        border: 1px solid rgba(255, 68, 68, 0.3);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 30px;
        font-size: 14px;
        color: #ff8888;
      }
      .btn {
        background: #1DB954;
        color: white;
        border: none;
        padding: 12px 32px;
        border-radius: 24px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        margin: 0 8px;
        transition: transform 0.2s;
      }
      .btn:hover {
        transform: scale(1.05);
      }
      .btn-secondary {
        background: #282828;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="error-icon">⚠️</div>
      <h1>Connection Failed</h1>
      <p>We couldn't connect your Spotify account.</p>
      <div class="error-message">${errorMessage}</div>
      <button class="btn" onclick="window.location.href='/api/spotify/auth/initiate'">Try Again</button>
      <button class="btn btn-secondary" onclick="window.close()">Close</button>
    </div>
    <script>
      // Trigger deep link to notify app of error
      setTimeout(() => {
        window.location.href = '${deepLink}';
      }, 100);
    </script>
  </body>
</html>`
}

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

      // Send success HTML page with auto-close
      const html = getSuccessHtml(result.spotifyUserId)
      res.setHeader('Content-Type', 'text/html')
      res.send(html)
    } catch (error) {
      // Send error HTML page
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const html = getErrorHtml(errorMessage)
      res.setHeader('Content-Type', 'text/html')
      res.send(html)
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
