import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest, ApiResponse } from '@/shared/types/global.types.js';
import { musicControlService } from '@/features/music-control/music-control.service.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { routeParam } from '@/shared/utils/route-params.js';
import { DeviceService } from '@/features/music-control/services/device.service.js';
import { deviceLicenseService } from '@/features/music-control/services/device-license.service.js';
import {
	deviceLicenseParamsSchema,
	userDevicesParamsSchema,
} from '@/features/music-control/music-control.validators.js';
import type {
	ControllableDevicesResponse,
	GrantDeviceLicenseResponse,
	MyDevicesResponse,
	RevokeDeviceLicenseResponse,
} from '@/features/music-control/music-control.types.js';

const deviceService = new DeviceService();

function sendData<T>(res: Response, data: T) {
	const response: ApiResponse<T> = {
		success: true,
		data,
		meta: {
			timestamp: new Date().toISOString(),
		},
	};
	res.status(200).json(response);
}

// UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(id: string): boolean {
	return UUID_REGEX.test(id);
}

/**
 * Music Control Controller
 */
export class MusicControlController {
	/**
	 * GET /api/music-control/permissions
	 * Get list of users that I have granted control to
	 */
	async getMyPermissions(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const userId = authReq.user.id;
			const allowedUserIds = await musicControlService.getGrantedPermissions(userId);

			const response: ApiResponse = {
				success: true,
				data: { allowedUserIds },
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.status(200).json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * POST /api/music-control/permissions/:userId
	 * Grant control permission to a friend
	 */
	async grantControl(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const ownerId = authReq.user.id;
			const allowedUserId = routeParam(req, 'userId');

			if (!isValidUuid(allowedUserId)) {
				throw new AppError(400, 'Invalid user ID format', 'INVALID_USER_ID');
			}

			await musicControlService.grantControl(ownerId, allowedUserId);

			const response: ApiResponse = {
				success: true,
				data: { success: true, allowedUserId },
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.status(200).json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * DELETE /api/music-control/permissions/:userId
	 * Revoke control permission from a user
	 */
	async revokeControl(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const ownerId = authReq.user.id;
			const allowedUserId = routeParam(req, 'userId');

			if (!isValidUuid(allowedUserId)) {
				throw new AppError(400, 'Invalid user ID format', 'INVALID_USER_ID');
			}

			await musicControlService.revokeControl(ownerId, allowedUserId);

			const response: ApiResponse = {
				success: true,
				data: { success: true, allowedUserId },
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.status(200).json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /api/music-control/can-control/:userId
	 * Check if the target user has granted me control
	 */
	async checkCanControl(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const myUserId = authReq.user.id;
			const targetUserId = routeParam(req, 'userId');

			if (!isValidUuid(targetUserId)) {
				throw new AppError(400, 'Invalid user ID format', 'INVALID_USER_ID');
			}

			const canControl = await musicControlService.canControl(myUserId, targetUserId);

			const response: ApiResponse = {
				success: true,
				data: { canControl, targetUserId },
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.status(200).json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /api/music-control/devices
	 * List my devices and the friends licensed on each
	 */
	async getMyDevices(req: Request, res: Response, next: NextFunction) {
		try {
			const ownerId = (req as AuthenticatedRequest).user.id;
			const devices = await deviceService.listMyDevices(ownerId);
			sendData<MyDevicesResponse>(res, { devices });
		} catch (error) {
			next(error);
		}
	}

	/**
	 * POST /api/music-control/devices/:deviceId/licenses/:userId
	 * Grant a mutual friend control of one of my devices
	 */
	async grantDeviceLicense(req: Request, res: Response, next: NextFunction) {
		try {
			const ownerId = (req as AuthenticatedRequest).user.id;
			const { deviceId, userId } = deviceLicenseParamsSchema.parse(req.params);
			const result = await deviceLicenseService.grant(ownerId, deviceId, userId);
			sendData<GrantDeviceLicenseResponse>(res, result);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * DELETE /api/music-control/devices/:deviceId/licenses/:userId
	 * Revoke a friend's license on one of my devices
	 */
	async revokeDeviceLicense(req: Request, res: Response, next: NextFunction) {
		try {
			const ownerId = (req as AuthenticatedRequest).user.id;
			const { deviceId, userId } = deviceLicenseParamsSchema.parse(req.params);
			await deviceLicenseService.revoke(ownerId, deviceId, userId);
			sendData<RevokeDeviceLicenseResponse>(res, {
				message: 'Device license revoked successfully',
			});
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /api/music-control/users/:userId/devices
	 * List the devices of a friend that I can control
	 */
	async getControllableDevices(req: Request, res: Response, next: NextFunction) {
		try {
			const viewerId = (req as AuthenticatedRequest).user.id;
			const { userId } = userDevicesParamsSchema.parse(req.params);
			const result = await deviceLicenseService.listControllable(viewerId, userId);
			sendData<ControllableDevicesResponse>(res, result);
		} catch (error) {
			next(error);
		}
	}
}

export const musicControlController = new MusicControlController();
