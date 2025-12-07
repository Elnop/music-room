import type { Request, Response, NextFunction } from 'express';
import { PlaylistService } from './playlist.service.js';
import {
  createPlaylistSchema,
  updatePlaylistSchema,
  addTrackSchema,
  reorderTracksSchema,
  addCollaboratorSchema,
} from './playlist.validators.js';
import type { ApiResponse, AuthenticatedRequest } from '@/shared/types/global.types.js';

const playlistService = new PlaylistService();

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
      const { id } = req.params;
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
      const { id } = req.params;
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
      const { id } = req.params;
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
      const { id } = req.params;
      const validated = addTrackSchema.parse(req.body);
      await playlistService.addTrack(id, authReq.user.id, validated);

      const response: ApiResponse = {
        success: true,
        data: { message: 'Track added successfully' },
        meta: { timestamp: new Date().toISOString() },
      };

      res.status(201).json(response);
    } catch (error) {
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
      const { id, trackId } = req.params;
      await playlistService.removeTrack(id, authReq.user.id, trackId);

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
      const { id } = req.params;
      const validated = reorderTracksSchema.parse(req.body);
      await playlistService.reorderTracks(id, authReq.user.id, validated.trackIds);

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
      const { id } = req.params;
      const validated = addCollaboratorSchema.parse(req.body);
      await playlistService.addCollaborator(id, authReq.user.id, validated.userId);

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
      const { id, userId } = req.params;
      await playlistService.removeCollaborator(id, authReq.user.id, userId);

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
}
