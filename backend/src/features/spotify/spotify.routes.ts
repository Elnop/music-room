import { Router } from 'express'
import { SpotifyController } from './spotify.controller.js'
import { authMiddleware } from '../auth/auth.middleware.js'

const router = Router()
const spotifyController = new SpotifyController()

/**
 * @route   GET /api/spotify/auth/initiate
 * @desc    Initiate Spotify OAuth flow
 * @access  Private (requires authentication)
 */
router.get('/auth/initiate', authMiddleware, (req, res, next) =>
  spotifyController.initiateAuth(req, res, next)
)

/**
 * @route   GET /api/spotify/auth/callback
 * @desc    Handle Spotify OAuth callback (web-based flow)
 * @access  Public (OAuth callback)
 */
router.get('/auth/callback', (req, res, next) => spotifyController.handleCallback(req, res, next))

/**
 * @route   POST /api/spotify/auth/exchange
 * @desc    Exchange authorization code for tokens (mobile flow)
 * @access  Public (OAuth exchange)
 */
router.post('/auth/exchange', (req, res, next) => spotifyController.exchangeCode(req, res, next))

/**
 * @route   GET /api/spotify/auth/status
 * @desc    Get Spotify connection status
 * @access  Private (requires authentication)
 */
router.get('/auth/status', authMiddleware, (req, res, next) =>
  spotifyController.getStatus(req, res, next)
)

/**
 * @route   POST /api/spotify/auth/disconnect
 * @desc    Disconnect Spotify account
 * @access  Private (requires authentication)
 */
router.post('/auth/disconnect', authMiddleware, (req, res, next) =>
  spotifyController.disconnect(req, res, next)
)

/**
 * @route   GET /api/spotify/search
 * @desc    Search Spotify catalog
 * @access  Private (requires authentication)
 */
router.get('/search', authMiddleware, (req, res, next) => spotifyController.search(req, res, next))

export default router
