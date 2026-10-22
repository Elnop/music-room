import { Router } from 'express';
import * as profile from '@/features/profile/profile.controller.js';
import * as avatar from '@/features/profile/profile-avatar.controller.js';
import * as settings from '@/features/profile/profile-settings.controller.js';
import { authMiddleware } from '@/features/auth/auth.middleware.js';
import { avatarRateLimiter } from '@/features/auth/middleware/rate-limit.middleware.js';
import { avatarUpload } from '@/features/profile/utils/avatar-upload.js';

// Endpoints are documented in profile*.openapi.ts.
const router = Router();

// Every profile route requires authentication.
router.use(authMiddleware);

router.patch('/', profile.updateProfile);
router.get('/', profile.getOwnProfile);
router.get('/search', profile.searchUsers);

router.get('/privacy', settings.getPrivacySettings);
router.put('/privacy', settings.updatePrivacySettings);
router.get('/music-preferences', settings.getMusicPreferences);
router.put('/music-preferences', settings.updateMusicPreferences);
router.get('/music-preferences/genres', settings.getAvailableGenres);

// Avatar changes are rate-limited per user.
router.put('/avatar', avatarRateLimiter, avatarUpload, avatar.uploadAvatar);
router.delete('/avatar', avatarRateLimiter, avatar.removeAvatar);

// Last, so it never shadows the paths above.
router.get('/:userId', profile.getProfile);

export default router;
