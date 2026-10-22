import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import { sendSuccess } from '@/shared/utils/send-success.js';
import { realtime } from '@/realtime/index.js';
import * as deviceService from '@/features/music-control/services/device.service.js';
import * as controllableDevicesService from '@/features/music-control/services/controllable-devices.service.js';
import {
	deviceParamsSchema,
	renameDeviceSchema,
} from '@/features/music-control/music-control.validators.js';

// The caller's devices (#294, #352) and the device picker (#295).

const userOf = (req: Request) => (req as AuthenticatedRequest).user.id;

/** GET /api/music-control/devices: my devices and the friends licensed on each. */
export async function getMyDevices(req: Request, res: Response) {
	sendSuccess(res, { devices: await deviceService.listMyDevices(userOf(req)) });
}

/**
 * PATCH /api/music-control/devices/:deviceId: rename one of my devices
 * (`name: null` goes back to the system name); a connected socket of that
 * device takes the new name at once.
 */
export async function renameDevice(req: Request, res: Response) {
	const ownerId = userOf(req);
	const { deviceId } = deviceParamsSchema.parse(req.params);
	const { name } = renameDeviceSchema.parse(req.body);
	const device = await deviceService.renameDevice(ownerId, deviceId, name);
	realtime.setDeviceName(ownerId, deviceId, device.deviceName);
	sendSuccess(res, { device });
}

/** GET /api/music-control/controllable-devices: the devices I can play on, mine then my friends'. */
export async function getDevicePicker(req: Request, res: Response) {
	sendSuccess(res, await controllableDevicesService.list(userOf(req)));
}
