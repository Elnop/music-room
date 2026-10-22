import type { Request, Response } from 'express';
import * as playlistService from '@/features/playlists/services/playlist.service.js';
import * as playlistListingService from '@/features/playlists/services/playlist-listing.service.js';
import * as playlistUpdateService from '@/features/playlists/services/playlist-update.service.js';
import {
	createPlaylistSchema,
	updatePlaylistSchema,
} from '@/features/playlists/playlist.validators.js';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import { routeParam } from '@/shared/utils/route-params.js';
import { sendSuccess } from '@/shared/utils/send-success.js';

// Playlists: lists, create, read, update, delete.

/** GET /api/playlists: the user's playlists (owned, collaborating, viewing). */
export async function getUserPlaylists(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	sendSuccess(res, { playlists: await playlistListingService.getUserPlaylists(userId) });
}

/** GET /api/playlists/public: public playlists of other users. */
export async function getPublicPlaylists(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	sendSuccess(res, { playlists: await playlistListingService.getPublicPlaylists(userId) });
}

/** GET /api/playlists/user/:userId: public ones, plus private ones the caller is invited to. */
export async function getPlaylistsByUser(req: Request, res: Response) {
	const currentUserId = (req as AuthenticatedRequest).user.id;
	const userId = routeParam(req, 'userId');
	const playlists = await playlistListingService.getPlaylistsByUser(userId, currentUserId);
	sendSuccess(res, { playlists });
}

/** POST /api/playlists */
export async function createPlaylist(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const validated = createPlaylistSchema.parse(req.body);
	const playlist = await playlistService.createPlaylist(userId, validated);
	sendSuccess(res, { playlist }, 201);
}

/** GET /api/playlists/:id: the playlist with its tracks. */
export async function getPlaylistById(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const id = routeParam(req, 'id');
	sendSuccess(res, { playlist: await playlistService.getPlaylistById(id, userId) });
}

/** PATCH /api/playlists/:id */
export async function updatePlaylist(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const id = routeParam(req, 'id');
	const validated = updatePlaylistSchema.parse(req.body);
	const playlist = await playlistUpdateService.updatePlaylist(id, userId, validated);
	sendSuccess(res, { playlist });
}

/** DELETE /api/playlists/:id */
export async function deletePlaylist(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const id = routeParam(req, 'id');
	await playlistUpdateService.deletePlaylist(id, userId);
	sendSuccess(res, { message: 'Playlist deleted successfully' });
}
