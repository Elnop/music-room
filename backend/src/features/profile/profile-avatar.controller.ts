import type { Request, Response } from 'express';
import * as avatarService from '@/features/profile/services/avatar.service.js';
import { avatarFileSchema } from '@/features/profile/profile.validators.js';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import { sendSuccess } from '@/shared/utils/send-success.js';

export async function uploadAvatar(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const file = avatarFileSchema.parse(req.file);
	sendSuccess(res, await avatarService.uploadAvatar(userId, file.buffer));
}

export async function removeAvatar(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	sendSuccess(res, await avatarService.removeAvatar(userId));
}
