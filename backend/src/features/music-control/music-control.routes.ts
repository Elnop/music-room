import { Router } from 'express';
import * as permissions from '@/features/music-control/music-control.controller.js';
import * as devices from '@/features/music-control/music-control-devices.controller.js';
import * as licenses from '@/features/music-control/music-control-licenses.controller.js';
import { authMiddleware } from '@/features/auth/auth.middleware.js';

// Endpoints are documented in music-control*.openapi.ts.
const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/permissions', permissions.getMyPermissions);
router.post('/permissions/:userId', permissions.grantControl);
router.delete('/permissions/:userId', permissions.revokeControl);
router.get('/can-control/:userId', permissions.checkCanControl);

router.get('/devices', devices.getMyDevices);
router.patch('/devices/:deviceId', devices.renameDevice);
router.get('/controllable-devices', devices.getDevicePicker);

router.post('/devices/:deviceId/licenses/:userId', licenses.grantDeviceLicense);
router.delete('/devices/:deviceId/licenses/:userId', licenses.revokeDeviceLicense);
router.get('/users/:userId/devices', licenses.getControllableDevices);

export default router;
