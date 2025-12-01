import { Router } from 'express'
import { authMiddleware } from '../auth/auth.middleware.js'
import { ProfileController } from './profile.controller.js'

const router = Router()
const controller = new ProfileController()

/**
 * All profile routes require authentication
 */
router.use(authMiddleware)

/**
 * @route   PATCH /api/profile
 * @desc    Update current user's profile
 * @access  Private
 */
router.patch('/', (req, res, next) => controller.updateProfile(req, res, next))

/**
 * @route   GET /api/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/', (req, res, next) => controller.getOwnProfile(req, res, next))

/**
 * @route   GET /api/profile/:userId
 * @desc    Get user profile by ID
 * @access  Private
 */
router.get('/:userId', (req, res, next) => controller.getProfile(req, res, next))

export { router as profileRoutes }
