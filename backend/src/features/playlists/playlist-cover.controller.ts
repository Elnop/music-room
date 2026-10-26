import type { Request, Response } from 'express';
import * as coverService from '@/features/playlists/services/playlist-cover.service.js';
import { coverFileSchema } from '@/features/playlists/playlist.validators.js';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import { routeParam } from '@/shared/utils/route-params.js';
import { sendSuccess } from '@/shared/utils/send-success.js';

export async function uploadCover(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const id = routeParam(req, 'id');
	const file = coverFileSchema.parse(req.file);
	sendSuccess(res, await coverService.uploadCover(id, userId, file.buffer));
}

export async function removeCover(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const id = routeParam(req, 'id');
	sendSuccess(res, await coverService.removeCover(id, userId));
}
