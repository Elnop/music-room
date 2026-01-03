import { Router } from 'express';
import { authMiddleware } from '@/features/auth/auth.middleware.js';
import { FriendsController } from '@/features/friends/friends.controller.js';

const router = Router();
const controller = new FriendsController();

/**
 * All friends routes require authentication
 */
router.use(authMiddleware);

/**
 * @route   GET /api/friends
 * @desc    Get mutual friends (users who follow each other)
 * @access  Private
 */
router.get('/', (req, res, next) => controller.getMutualFriends(req, res, next));

/**
 * @route   GET /api/friends/stats/me
 * @desc    Get own followers/following stats
 * @access  Private
 */
router.get('/stats/me', (req, res, next) => controller.getMyStats(req, res, next));

/**
 * @route   GET /api/friends/status/:userId
 * @desc    Get follow status with a user
 * @access  Private
 */
router.get('/status/:userId', (req, res, next) => controller.getFollowStatus(req, res, next));

/**
 * @route   POST /api/friends/follow/:userId
 * @desc    Follow a user
 * @access  Private
 */
router.post('/follow/:userId', (req, res, next) => controller.followUser(req, res, next));

/**
 * @route   DELETE /api/friends/follow/:userId
 * @desc    Unfollow a user
 * @access  Private
 */
router.delete('/follow/:userId', (req, res, next) => controller.unfollowUser(req, res, next));

export default router;
