import type { Request, Response } from 'express';
import * as playlistTrackService from '@/features/playlists/services/playlist-track.service.js';
import { moveTrackSchema, trackIdParamSchema } from '@/features/playlists/playlist.validators.js';
import { addTrackSchema } from '@/shared/utils/track-upsert.js';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import { routeParam } from '@/shared/utils/route-params.js';
import { sendSuccess } from '@/shared/utils/send-success.js';

export async function addTrack(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const id = routeParam(req, 'id');
	const validated = addTrackSchema.parse(req.body);
	sendSuccess(res, await playlistTrackService.addTrack(id, userId, validated), 201);
}

export async function removeTrack(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const id = routeParam(req, 'id');
	const { trackId } = trackIdParamSchema.parse(req.params);
	sendSuccess(res, await playlistTrackService.removeTrack(id, userId, trackId));
}

export async function moveTrack(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const id = routeParam(req, 'id');
	const { trackId } = trackIdParamSchema.parse(req.params);
	const validated = moveTrackSchema.parse(req.body);
	sendSuccess(res, await playlistTrackService.moveTrack(id, userId, trackId, validated));
}
