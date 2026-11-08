import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import { sendSuccess } from '@/shared/utils/send-success.js';
import * as deviceLicenseService from '@/features/music-control/services/device-license.service.js';
import {
	deviceLicenseParamsSchema,
	userDevicesParamsSchema,
} from '@/features/music-control/music-control.validators.js';

const userOf = (req: Request) => (req as AuthenticatedRequest).user.id;

export async function grantDeviceLicense(req: Request, res: Response) {
	const { deviceId, userId } = deviceLicenseParamsSchema.parse(req.params);
	sendSuccess(res, await deviceLicenseService.grant(userOf(req), deviceId, userId));
}

export async function revokeDeviceLicense(req: Request, res: Response) {
	const { deviceId, userId } = deviceLicenseParamsSchema.parse(req.params);
	await deviceLicenseService.revoke(userOf(req), deviceId, userId);
	sendSuccess(res, { message: 'Device license revoked successfully' });
}

export async function getControllableDevices(req: Request, res: Response) {
	const { userId } = userDevicesParamsSchema.parse(req.params);
	sendSuccess(res, await deviceLicenseService.listControllable(userOf(req), userId));
}
