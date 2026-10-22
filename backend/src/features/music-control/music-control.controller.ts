import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { routeParam } from '@/shared/utils/route-params.js';
import { sendSuccess } from '@/shared/utils/send-success.js';
import * as controlSwitchService from '@/features/music-control/services/control-switch.service.js';
import * as controlPermissionsService from '@/features/music-control/services/control-permissions.service.js';

// The "all my devices" switch: /permissions and /can-control.

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const userOf = (req: Request) => (req as AuthenticatedRequest).user.id;

/** `:userId`, or 400 INVALID_USER_ID when it is not a UUID v4. */
function friendOf(req: Request): string {
	const userId = routeParam(req, 'userId');
	if (!UUID_V4.test(userId)) {
		throw new AppError(400, 'Invalid user ID format', 'INVALID_USER_ID');
	}
	return userId;
}

/** GET /api/music-control/permissions */
export async function getMyPermissions(req: Request, res: Response) {
	const allowedUserIds = await controlPermissionsService.getGrantedPermissions(userOf(req));
	sendSuccess(res, { allowedUserIds });
}

/** POST /api/music-control/permissions/:userId */
export async function grantControl(req: Request, res: Response) {
	const allowedUserId = friendOf(req);
	await controlSwitchService.grantControl(userOf(req), allowedUserId);
	sendSuccess(res, { success: true, allowedUserId });
}

/** DELETE /api/music-control/permissions/:userId */
export async function revokeControl(req: Request, res: Response) {
	const allowedUserId = friendOf(req);
	await controlSwitchService.revokeControl(userOf(req), allowedUserId);
	sendSuccess(res, { success: true, allowedUserId });
}

/** GET /api/music-control/can-control/:userId */
export async function checkCanControl(req: Request, res: Response) {
	const targetUserId = friendOf(req);
	const canControl = await controlPermissionsService.canControl(userOf(req), targetUserId);
	sendSuccess(res, { canControl, targetUserId });
}
