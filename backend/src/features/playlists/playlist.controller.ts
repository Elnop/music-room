import type { Request, Response, NextFunction } from 'express';
import { PlaylistService } from '@/features/playlists/playlist.service.js';
import { PlaylistTrackService } from '@/features/playlists/services/playlist-track.service.js';
import { CollaboratorService } from '@/features/playlists/services/collaborator.service.js';
import { ViewerService } from '@/features/playlists/services/viewer.service.js';
import {
	createPlaylistSchema,
	updatePlaylistSchema,
	addTrackSchema,
	reorderTracksSchema,
	addCollaboratorSchema,
	addViewerSchema,
} from '@/features/playlists/playlist.validators.js';
import type { ApiResponse, AuthenticatedRequest } from '@/shared/types/global.types.js';
import { logger } from '@/shared/utils/logger.js';
import { routeParam } from '@/shared/utils/route-params.js';

const playlistService = new PlaylistService();
const trackService = new PlaylistTrackService();
const collaboratorService = new CollaboratorService();
const viewerService = new ViewerService();

export class PlaylistController {
	/**
	 * GET /api/playlists
	 * Get user's playlists (owned + collaborating)
	 */
	async getUserPlaylists(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const playlists = await playlistService.getUserPlaylists(authReq.user.id);

			const response: ApiResponse = {
				success: true,
				data: { playlists },
				meta: { timestamp: new Date().toISOString() },
			};

			res.json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /api/playlists/public
	 * Get all public playlists (excluding current user's)
	 */
	async getPublicPlaylists(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const playlists = await playlistService.getPublicPlaylists(authReq.user.id);

			const response: ApiResponse = {
				success: true,
				data: { playlists },
				meta: { timestamp: new Date().toISOString() },
			};

			res.json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /api/playlists/user/:userId
	 * Get playlists of a specific user (public + private where current user is invited)
	 */
	async getPlaylistsByUser(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const userId = routeParam(req, 'userId');
			const playlists = await playlistService.getPlaylistsByUser(userId, authReq.user.id);

			const response: ApiResponse = {
				success: true,
				data: { playlists },
				meta: { timestamp: new Date().toISOString() },
			};

			res.json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * POST /api/playlists
	 * Create new playlist
	 */
	async createPlaylist(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const validated = createPlaylistSchema.parse(req.body);
			const playlist = await playlistService.createPlaylist(authReq.user.id, validated);

			const response: ApiResponse = {
				success: true,
				data: { playlist },
				meta: { timestamp: new Date().toISOString() },
			};

			res.status(201).json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /api/playlists/:id
	 * Get playlist by ID with tracks
	 */
	async getPlaylistById(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const id = routeParam(req, 'id');
			const playlist = await playlistService.getPlaylistById(id, authReq.user.id);

			const response: ApiResponse = {
				success: true,
				data: { playlist },
				meta: { timestamp: new Date().toISOString() },
			};

			res.json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * PATCH /api/playlists/:id
	 * Update playlist metadata
	 */
	async updatePlaylist(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const id = routeParam(req, 'id');
			const validated = updatePlaylistSchema.parse(req.body);
			const playlist = await playlistService.updatePlaylist(id, authReq.user.id, validated);

			const response: ApiResponse = {
				success: true,
				data: { playlist },
				meta: { timestamp: new Date().toISOString() },
			};

			res.json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * DELETE /api/playlists/:id
	 * Delete playlist
	 */
	async deletePlaylist(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const id = routeParam(req, 'id');
			await playlistService.deletePlaylist(id, authReq.user.id);

			const response: ApiResponse = {
				success: true,
				data: { message: 'Playlist deleted successfully' },
				meta: { timestamp: new Date().toISOString() },
			};

			res.json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * POST /api/playlists/:id/tracks
	 * Add track to playlist
	 */
	async addTrack(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const id = routeParam(req, 'id');

			const body = req.body as { albumArt?: string; previewUrl?: string };
			logger.debug('[Playlist Controller] Add track request', {
				playlistId: id,
				userId: authReq.user.id,
				body: {
					...req.body,
					albumArt: body.albumArt ? 'present' : 'empty/undefined',
					previewUrl: body.previewUrl ? 'present' : 'empty/undefined',
				},
			});

			const validated = addTrackSchema.parse(req.body);

			logger.debug('[Playlist Controller] Validation passed', {
				validated: {
					...validated,
					albumArt: validated.albumArt ? 'present' : 'undefined',
					previewUrl: validated.previewUrl ? 'present' : 'undefined',
				},
			});

			await trackService.addTrack(id, authReq.user.id, validated);

			logger.info('[Playlist Controller] Track added successfully', {
				playlistId: id,
				trackUri: validated.trackUri,
			});

			const response: ApiResponse = {
				success: true,
				data: { message: 'Track added successfully' },
				meta: { timestamp: new Date().toISOString() },
			};

			res.status(201).json(response);
		} catch (error) {
			logger.error('[Playlist Controller] Error adding track', {
				error: error instanceof Error ? error.message : 'Unknown error',
				playlistId: req.params.id,
				body: req.body,
			});
			next(error);
		}
	}

	/**
	 * DELETE /api/playlists/:id/tracks/:trackId
	 * Remove track from playlist
	 */
	async removeTrack(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const id = routeParam(req, 'id');
			const trackId = routeParam(req, 'trackId');
			await trackService.removeTrack(id, authReq.user.id, trackId);

			const response: ApiResponse = {
				success: true,
				data: { message: 'Track removed successfully' },
				meta: { timestamp: new Date().toISOString() },
			};

			res.json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * PUT /api/playlists/:id/tracks/reorder
	 * Reorder tracks in playlist
	 */
	async reorderTracks(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const id = routeParam(req, 'id');
			const validated = reorderTracksSchema.parse(req.body);
			await trackService.reorderTracks(id, authReq.user.id, validated.trackIds);

			const response: ApiResponse = {
				success: true,
				data: { message: 'Tracks reordered successfully' },
				meta: { timestamp: new Date().toISOString() },
			};

			res.json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * POST /api/playlists/:id/collaborators
	 * Add collaborator to playlist
	 */
	async addCollaborator(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const id = routeParam(req, 'id');
			const validated = addCollaboratorSchema.parse(req.body);
			await collaboratorService.addCollaborator(id, authReq.user.id, validated.userId);

			const response: ApiResponse = {
				success: true,
				data: { message: 'Collaborator added successfully' },
				meta: { timestamp: new Date().toISOString() },
			};

			res.status(201).json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * DELETE /api/playlists/:id/collaborators/:userId
	 * Remove collaborator from playlist
	 */
	async removeCollaborator(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const id = routeParam(req, 'id');
			const userId = routeParam(req, 'userId');
			await collaboratorService.removeCollaborator(id, authReq.user.id, userId);

			const response: ApiResponse = {
				success: true,
				data: { message: 'Collaborator removed successfully' },
				meta: { timestamp: new Date().toISOString() },
			};

			res.json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /api/playlists/:id/viewers
	 * Get all viewers for a playlist
	 */
	async getViewers(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const id = routeParam(req, 'id');
			const viewers = await viewerService.getViewers(id, authReq.user.id);

			const response: ApiResponse = {
				success: true,
				data: { viewers },
				meta: { timestamp: new Date().toISOString() },
			};

			res.json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * POST /api/playlists/:id/viewers
	 * Add viewer to playlist
	 */
	async addViewer(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const id = routeParam(req, 'id');
			const validated = addViewerSchema.parse(req.body);
			await viewerService.addViewer(id, authReq.user.id, validated.userId);

			const response: ApiResponse = {
				success: true,
				data: { message: 'Viewer added successfully' },
				meta: { timestamp: new Date().toISOString() },
			};

			res.status(201).json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * DELETE /api/playlists/:id/viewers/:userId
	 * Remove viewer from playlist
	 */
	async removeViewer(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const id = routeParam(req, 'id');
			const userId = routeParam(req, 'userId');
			await viewerService.removeViewer(id, authReq.user.id, userId);

			const response: ApiResponse = {
				success: true,
				data: { message: 'Viewer removed successfully' },
				meta: { timestamp: new Date().toISOString() },
			};

			res.json(response);
		} catch (error) {
			next(error);
		}
	}
}
