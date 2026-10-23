import { Router } from 'express';
import { authMiddleware } from '@/features/auth/auth.middleware.js';
import * as friends from '@/features/friends/friends.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', friends.getMutualFriends);
router.get('/stats/me', friends.getMyStats);
router.get('/status/:userId', friends.getFollowStatus);
router.post('/follow/:userId', friends.followUser);
router.delete('/follow/:userId', friends.unfollowUser);

export default router;
