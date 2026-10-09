import { Router } from 'express';
import { musicControlController } from '@/features/music-control/music-control.controller.js';
import { authMiddleware } from '@/features/auth/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/music-control/permissions
 * Get list of users that I have granted control to
 */
router.get('/permissions', (req, res, next) =>
	musicControlController.getMyPermissions(req, res, next)
);

/**
 * POST /api/music-control/permissions/:userId
 * Grant control permission to a friend
 */
router.post('/permissions/:userId', (req, res, next) =>
	musicControlController.grantControl(req, res, next)
);

/**
 * DELETE /api/music-control/permissions/:userId
 * Revoke control permission from a user
 */
router.delete('/permissions/:userId', (req, res, next) =>
	musicControlController.revokeControl(req, res, next)
);

/**
 * GET /api/music-control/can-control/:userId
 * Check if the target user has granted me control
 */
router.get('/can-control/:userId', (req, res, next) =>
	musicControlController.checkCanControl(req, res, next)
);

/**
 * GET /api/music-control/devices
 * List my devices and their licenses
 */
router.get('/devices', (req, res, next) => musicControlController.getMyDevices(req, res, next));

/**
 * POST /api/music-control/devices/:deviceId/licenses/:userId
 * Grant a friend control of one of my devices
 */
router.post('/devices/:deviceId/licenses/:userId', (req, res, next) =>
	musicControlController.grantDeviceLicense(req, res, next)
);

/**
 * DELETE /api/music-control/devices/:deviceId/licenses/:userId
 * Revoke a friend from one of my devices
 */
router.delete('/devices/:deviceId/licenses/:userId', (req, res, next) =>
	musicControlController.revokeDeviceLicense(req, res, next)
);

/**
 * GET /api/music-control/users/:userId/devices
 * List a friend's devices I can control
 */
router.get('/users/:userId/devices', (req, res, next) =>
	musicControlController.getControllableDevices(req, res, next)
);

export default router;
