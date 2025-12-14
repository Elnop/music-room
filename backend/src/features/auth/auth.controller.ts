import type { Request, Response, NextFunction } from 'express'
import { AuthService } from './auth.service.js'
import { registerSchema, loginSchema } from './auth.validators.js'
import type { ApiResponse } from '@/shared/types/global.types.js'
import type { AuthenticatedRequest } from '@/shared/types/global.types.js'
import { logger } from '@/shared/utils/logger.js'

const authService = new AuthService()

export class AuthController {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      logger.debug('🔵 Register request received', {
        body: req.body,
        headers: {
          'content-type': req.headers['content-type'],
          'user-agent': req.headers['user-agent']
        }
      })

      const validated = registerSchema.parse(req.body)
      logger.debug('🔵 Validation passed', { email: validated.email, username: validated.username })

      const result = await authService.register(validated)
      logger.debug('🔵 Registration successful', { userId: result.user.id })

      const response: ApiResponse = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      }

      res.status(201).json(response)
    } catch (error) {
      logger.error('🔴 Register error', { error })
      next(error)
    }
  }

  /**
   * POST /api/auth/login
   * Login user with email and password
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('🔵 Login request received', {
        email: req.body?.email,
        hasPassword: !!req.body?.password,
        contentType: req.headers['content-type'],
        origin: req.headers['origin']
      })

      const validated = loginSchema.parse(req.body)
      logger.info('🔵 Login validation passed', { email: validated.email })

      const result = await authService.login(validated)
      logger.info('🔵 Login successful', {
        userId: result.user.id,
        email: result.user.email,
        hasAccessToken: !!result.session.accessToken
      })

      const response: ApiResponse = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      }

      res.json(response)
    } catch (error) {
      logger.error('🔴 Login error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        email: req.body?.email
      })
      next(error)
    }
  }

  /**
   * GET /api/auth/me
   * Get current authenticated user profile
   */
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest
      const profile = await authService.getUserProfile(authReq.user.id)

      const response: ApiResponse = {
        success: true,
        data: { user: profile },
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
   * POST /api/auth/logout
   * Logout current user (client-side token removal)
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('User logout', { userId: (req as AuthenticatedRequest).user.id })

      const response: ApiResponse = {
        success: true,
        data: { message: 'Logged out successfully' },
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
