import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type {
  CreatePlaylistDTO,
  UpdatePlaylistDTO,
  AddTrackDTO,
  PlaylistResponse,
  PlaylistWithTracksResponse,
  TrackResponse,
  PlaylistRow,
  TrackRow,
  PlaylistTrackRow,
} from './playlist.types.js';

export class PlaylistService {
  /**
   * Get all playlists for a user (owned + collaborating)
   */
  async getUserPlaylists(userId: string): Promise<PlaylistResponse[]> {
    try {
      const { data: playlists, error } = await supabaseAdmin
        .from('playlists')
        .select('*')
        .or(`owner_id.eq.${userId},collaborator_ids.cs.{${userId}}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get track counts for each playlist
      const playlistIds = playlists.map((p) => p.id);
      if (playlistIds.length === 0) {
        return [];
      }

      const { data: trackCounts, error: countError } = await supabaseAdmin
        .from('playlist_tracks')
        .select('playlist_id')
        .in('playlist_id', playlistIds);

      if (countError) throw countError;

      const countMap = trackCounts.reduce((acc, row) => {
        acc[row.playlist_id] = (acc[row.playlist_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return playlists.map((p) => this.formatPlaylistResponse(p, countMap[p.id] || 0));
    } catch (error) {
      logger.error('Failed to get user playlists', { error, userId });
      throw new AppError(500, 'Failed to fetch playlists', 'PLAYLIST_FETCH_ERROR');
    }
  }

  /**
   * Get playlist by ID with full track data
   */
  async getPlaylistById(playlistId: string, userId?: string): Promise<PlaylistWithTracksResponse> {
    try {
      // Get playlist
      const { data: playlist, error: playlistError } = await supabaseAdmin
        .from('playlists')
        .select('*')
        .eq('id', playlistId)
        .single();

      if (playlistError || !playlist) {
        throw new AppError(404, 'Playlist not found', 'PLAYLIST_NOT_FOUND');
      }

      // Check permissions (if userId provided)
      if (userId && !this.canViewPlaylist(playlist, userId)) {
        throw new AppError(403, 'Access denied', 'PLAYLIST_ACCESS_DENIED');
      }

      // Get tracks with position
      const { data: playlistTracks, error: tracksError } = await supabaseAdmin
        .from('playlist_tracks')
        .select(`
          position,
          added_by,
          added_at,
          tracks:track_id (*)
        `)
        .eq('playlist_id', playlistId)
        .order('position', { ascending: true });

      if (tracksError) throw tracksError;

      // Get owner info
      const { data: owner, error: ownerError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', playlist.owner_id)
        .single();

      if (ownerError || !owner) {
        throw new AppError(404, 'Playlist owner not found', 'OWNER_NOT_FOUND');
      }

      // Format tracks
      const formattedTracks = playlistTracks.map((pt) => ({
        ...this.formatTrackResponse(pt.tracks as unknown as TrackRow),
        position: pt.position,
        addedBy: pt.added_by,
        addedAt: pt.added_at,
      }));

      return {
        ...this.formatPlaylistResponse(playlist, formattedTracks.length),
        tracks: formattedTracks,
        owner: {
          id: owner.id,
          username: owner.username,
          displayName: owner.display_name,
          avatarUrl: owner.avatar_url,
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get playlist', { error, playlistId });
      throw new AppError(500, 'Failed to fetch playlist', 'PLAYLIST_FETCH_ERROR');
    }
  }

  /**
   * Create new playlist
   */
  async createPlaylist(userId: string, data: CreatePlaylistDTO): Promise<PlaylistResponse> {
    try {
      const { data: playlist, error } = await supabaseAdmin
        .from('playlists')
        .insert({
          name: data.name,
          description: data.description,
          owner_id: userId,
          visibility: data.visibility,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Playlist created', { playlistId: playlist.id, userId });
      return this.formatPlaylistResponse(playlist, 0);
    } catch (error) {
      logger.error('Failed to create playlist', { error, userId });
      throw new AppError(500, 'Failed to create playlist', 'PLAYLIST_CREATE_ERROR');
    }
  }

  /**
   * Update playlist
   */
  async updatePlaylist(playlistId: string, userId: string, data: UpdatePlaylistDTO): Promise<PlaylistResponse> {
    try {
      await this.checkOwnership(playlistId, userId);

      const { data: playlist, error } = await supabaseAdmin
        .from('playlists')
        .update({
          name: data.name,
          description: data.description,
          visibility: data.visibility,
        })
        .eq('id', playlistId)
        .select()
        .single();

      if (error) throw error;

      // Get track count
      const { count } = await supabaseAdmin
        .from('playlist_tracks')
        .select('*', { count: 'exact', head: true })
        .eq('playlist_id', playlistId);

      logger.info('Playlist updated', { playlistId, userId });
      return this.formatPlaylistResponse(playlist, count || 0);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to update playlist', { error, playlistId });
      throw new AppError(500, 'Failed to update playlist', 'PLAYLIST_UPDATE_ERROR');
    }
  }

  /**
   * Delete playlist
   */
  async deletePlaylist(playlistId: string, userId: string): Promise<void> {
    try {
      await this.checkOwnership(playlistId, userId);

      const { error } = await supabaseAdmin
        .from('playlists')
        .delete()
        .eq('id', playlistId);

      if (error) throw error;

      logger.info('Playlist deleted', { playlistId, userId });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to delete playlist', { error, playlistId });
      throw new AppError(500, 'Failed to delete playlist', 'PLAYLIST_DELETE_ERROR');
    }
  }

  /**
   * Add track to playlist
   */
  async addTrack(playlistId: string, userId: string, track: AddTrackDTO): Promise<void> {
    try {
      // Check permission
      await this.checkEditPermission(playlistId, userId);

      // Upsert track (insert if not exists, return existing if duplicate track_uri)
      const { data: trackData, error: trackError } = await supabaseAdmin
        .from('tracks')
        .upsert(
          {
            track_uri: track.trackUri,
            title: track.title,
            artist: track.artist,
            album: track.album,
            album_art: track.albumArt,
            duration_ms: track.durationMs,
            preview_url: track.previewUrl,
          },
          { onConflict: 'track_uri' }
        )
        .select()
        .single();

      if (trackError) throw trackError;

      // Get next position using RPC function
      const { data: maxPos } = await supabaseAdmin.rpc('get_next_playlist_position', {
        p_playlist_id: playlistId,
      });

      const nextPosition = maxPos ?? 0;

      // Add to playlist_tracks
      const { error: addError } = await supabaseAdmin.from('playlist_tracks').insert({
        playlist_id: playlistId,
        track_id: trackData.id,
        position: nextPosition,
        added_by: userId,
      });

      if (addError) {
        // Check if duplicate track (unique constraint violation)
        if (addError.code === '23505') {
          throw new AppError(409, 'Track already in playlist', 'TRACK_DUPLICATE');
        }
        throw addError;
      }

      logger.info('Track added to playlist', { playlistId, trackId: trackData.id, userId });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to add track', { error, playlistId });
      throw new AppError(500, 'Failed to add track', 'TRACK_ADD_ERROR');
    }
  }

  /**
   * Remove track from playlist
   */
  async removeTrack(playlistId: string, userId: string, trackId: string): Promise<void> {
    try {
      await this.checkEditPermission(playlistId, userId);

      const { error } = await supabaseAdmin
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('track_id', trackId);

      if (error) throw error;

      // Re-index positions (close gaps)
      await this.reindexPositions(playlistId);

      logger.info('Track removed from playlist', { playlistId, trackId, userId });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to remove track', { error, playlistId, trackId });
      throw new AppError(500, 'Failed to remove track', 'TRACK_REMOVE_ERROR');
    }
  }

  /**
   * Reorder tracks in playlist
   */
  async reorderTracks(playlistId: string, userId: string, trackIds: string[]): Promise<void> {
    try {
      await this.checkEditPermission(playlistId, userId);

      // Verify all tracks belong to playlist
      const { data: existingTracks, error: fetchError } = await supabaseAdmin
        .from('playlist_tracks')
        .select('track_id')
        .eq('playlist_id', playlistId);

      if (fetchError) throw fetchError;

      const existingIds = new Set(existingTracks.map((t) => t.track_id));
      const allExist = trackIds.every((id) => existingIds.has(id));

      if (!allExist || trackIds.length !== existingIds.size) {
        throw new AppError(400, 'Invalid track IDs for reordering', 'INVALID_TRACK_IDS');
      }

      // Delete and re-insert with new positions
      const { error: deleteError } = await supabaseAdmin
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId);

      if (deleteError) throw deleteError;

      const inserts = trackIds.map((trackId, index) => ({
        playlist_id: playlistId,
        track_id: trackId,
        position: index,
        added_by: userId,
      }));

      const { error: insertError } = await supabaseAdmin.from('playlist_tracks').insert(inserts);

      if (insertError) throw insertError;

      logger.info('Playlist tracks reordered', { playlistId, userId });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to reorder tracks', { error, playlistId });
      throw new AppError(500, 'Failed to reorder tracks', 'TRACK_REORDER_ERROR');
    }
  }

  /**
   * Add collaborator to playlist
   */
  async addCollaborator(playlistId: string, userId: string, collaboratorId: string): Promise<void> {
    try {
      await this.checkOwnership(playlistId, userId);

      // Verify collaborator exists
      const { data: user, error: userError } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('id', collaboratorId)
        .single();

      if (userError || !user) {
        throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
      }

      // Get current playlist
      const { data: playlist, error: playlistError } = await supabaseAdmin
        .from('playlists')
        .select('collaborator_ids')
        .eq('id', playlistId)
        .single();

      if (playlistError || !playlist) {
        throw new AppError(404, 'Playlist not found', 'PLAYLIST_NOT_FOUND');
      }

      // Check if already collaborator
      if (playlist.collaborator_ids.includes(collaboratorId)) {
        throw new AppError(409, 'User is already a collaborator', 'ALREADY_COLLABORATOR');
      }

      // Add collaborator
      const { error: updateError } = await supabaseAdmin
        .from('playlists')
        .update({
          collaborator_ids: [...playlist.collaborator_ids, collaboratorId],
        })
        .eq('id', playlistId);

      if (updateError) throw updateError;

      logger.info('Collaborator added to playlist', { playlistId, userId, collaboratorId });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to add collaborator', { error, playlistId });
      throw new AppError(500, 'Failed to add collaborator', 'COLLABORATOR_ADD_ERROR');
    }
  }

  /**
   * Remove collaborator from playlist
   */
  async removeCollaborator(playlistId: string, userId: string, collaboratorId: string): Promise<void> {
    try {
      await this.checkOwnership(playlistId, userId);

      // Get current playlist
      const { data: playlist, error: playlistError } = await supabaseAdmin
        .from('playlists')
        .select('collaborator_ids')
        .eq('id', playlistId)
        .single();

      if (playlistError || !playlist) {
        throw new AppError(404, 'Playlist not found', 'PLAYLIST_NOT_FOUND');
      }

      // Remove collaborator
      const { error: updateError } = await supabaseAdmin
        .from('playlists')
        .update({
          collaborator_ids: playlist.collaborator_ids.filter((id) => id !== collaboratorId),
        })
        .eq('id', playlistId);

      if (updateError) throw updateError;

      logger.info('Collaborator removed from playlist', { playlistId, userId, collaboratorId });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to remove collaborator', { error, playlistId });
      throw new AppError(500, 'Failed to remove collaborator', 'COLLABORATOR_REMOVE_ERROR');
    }
  }

  // ===== Helper Methods =====

  /**
   * Check if user can view playlist
   */
  private canViewPlaylist(playlist: PlaylistRow, userId: string): boolean {
    return (
      playlist.visibility === 'public' ||
      playlist.owner_id === userId ||
      playlist.collaborator_ids.includes(userId)
    );
  }

  /**
   * Check if user is owner (throws if not)
   */
  private async checkOwnership(playlistId: string, userId: string): Promise<void> {
    const { data: playlist, error } = await supabaseAdmin
      .from('playlists')
      .select('owner_id')
      .eq('id', playlistId)
      .single();

    if (error || !playlist) {
      throw new AppError(404, 'Playlist not found', 'PLAYLIST_NOT_FOUND');
    }

    if (playlist.owner_id !== userId) {
      throw new AppError(403, 'Access denied', 'PLAYLIST_ACCESS_DENIED');
    }
  }

  /**
   * Check if user can edit playlist (throws if not)
   */
  private async checkEditPermission(playlistId: string, userId: string): Promise<void> {
    const { data: playlist, error } = await supabaseAdmin
      .from('playlists')
      .select('owner_id, collaborator_ids')
      .eq('id', playlistId)
      .single();

    if (error || !playlist) {
      throw new AppError(404, 'Playlist not found', 'PLAYLIST_NOT_FOUND');
    }

    if (playlist.owner_id !== userId && !playlist.collaborator_ids.includes(userId)) {
      throw new AppError(403, 'Access denied', 'PLAYLIST_ACCESS_DENIED');
    }
  }

  /**
   * Format playlist row to response
   */
  private formatPlaylistResponse(row: PlaylistRow, trackCount: number): PlaylistResponse {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      coverUrl: row.cover_url,
      ownerId: row.owner_id,
      collaboratorIds: row.collaborator_ids,
      visibility: row.visibility,
      trackCount,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Format track row to response
   */
  private formatTrackResponse(row: TrackRow): TrackResponse {
    return {
      id: row.id,
      trackUri: row.track_uri,
      title: row.title,
      artist: row.artist,
      album: row.album,
      albumArt: row.album_art,
      durationMs: row.duration_ms,
      previewUrl: row.preview_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Re-index positions after deletion
   */
  private async reindexPositions(playlistId: string): Promise<void> {
    const { data: tracks, error } = await supabaseAdmin
      .from('playlist_tracks')
      .select('*')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true });

    if (error) throw error;

    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].position !== i) {
        await supabaseAdmin.from('playlist_tracks').update({ position: i }).eq('id', tracks[i].id);
      }
    }
  }
}
