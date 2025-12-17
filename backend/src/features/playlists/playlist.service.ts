import { supabaseAdmin } from "@/shared/config/supabase.js";
import { AppError } from "@/shared/middleware/error-handler.js";
import { logger } from "@/shared/utils/logger.js";
import { PlaylistPermissions } from "./permissions/playlist.permissions.js";
import {
  formatPlaylistResponse,
  formatTrackResponse,
} from "./utils/playlist.helpers.js";
import type {
  CreatePlaylistDTO,
  UpdatePlaylistDTO,
  PlaylistResponse,
  PlaylistWithTracksResponse,
  TrackRow,
} from "./playlist.types.js";

/**
 * Service for playlist CRUD operations
 */
export class PlaylistService {
  private permissions: PlaylistPermissions;

  constructor() {
    this.permissions = new PlaylistPermissions();
  }

  /**
   * Get all playlists for a user (owned + collaborating)
   */
  async getUserPlaylists(userId: string): Promise<PlaylistResponse[]> {
    try {
      const { data: playlists, error } = await supabaseAdmin
        .from("playlists")
        .select("*")
        .or(`owner_id.eq.${userId},collaborator_ids.cs.{${userId}}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get track counts for each playlist
      const playlistIds = playlists.map((p) => p.id);
      if (playlistIds.length === 0) {
        return [];
      }

      const { data: trackCounts, error: countError } = await supabaseAdmin
        .from("playlist_tracks")
        .select("playlist_id")
        .in("playlist_id", playlistIds);

      if (countError) throw countError;

      const countMap = trackCounts.reduce(
        (acc, row) => {
          acc[row.playlist_id] = (acc[row.playlist_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      return playlists.map((p) =>
        formatPlaylistResponse(p, countMap[p.id] || 0),
      );
    } catch (error) {
      logger.error("Failed to get user playlists", { error, userId });
      throw new AppError(
        500,
        "Failed to fetch playlists",
        "PLAYLIST_FETCH_ERROR",
      );
    }
  }

  /**
   * Get playlist by ID with full track data
   */
  async getPlaylistById(
    playlistId: string,
    userId?: string,
  ): Promise<PlaylistWithTracksResponse> {
    try {
      // Get playlist
      const { data: playlist, error: playlistError } = await supabaseAdmin
        .from("playlists")
        .select("*")
        .eq("id", playlistId)
        .single();

      if (playlistError || !playlist) {
        throw new AppError(404, "Playlist not found", "PLAYLIST_NOT_FOUND");
      }

      // Check permissions (if userId provided)
      if (userId && !this.permissions.canViewPlaylist(playlist, userId)) {
        throw new AppError(403, "Access denied", "PLAYLIST_ACCESS_DENIED");
      }

      // Get tracks with position
      const { data: playlistTracks, error: tracksError } = await supabaseAdmin
        .from("playlist_tracks")
        .select(
          `
          position,
          added_by,
          added_at,
          tracks:track_id (*)
        `,
        )
        .eq("playlist_id", playlistId)
        .order("position", { ascending: true });

      if (tracksError) throw tracksError;

      // Get owner info
      const { data: owner, error: ownerError } = await supabaseAdmin
        .from("user_profiles")
        .select("id, username, display_name, avatar_url")
        .eq("id", playlist.owner_id)
        .single();

      if (ownerError || !owner) {
        throw new AppError(404, "Playlist owner not found", "OWNER_NOT_FOUND");
      }

      // Format tracks
      const formattedTracks = playlistTracks.map((pt) => ({
        ...formatTrackResponse(pt.tracks as unknown as TrackRow),
        position: pt.position,
        addedBy: pt.added_by,
        addedAt: pt.added_at,
      }));

      return {
        ...formatPlaylistResponse(playlist, formattedTracks.length),
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
      logger.error("Failed to get playlist", { error, playlistId });
      throw new AppError(
        500,
        "Failed to fetch playlist",
        "PLAYLIST_FETCH_ERROR",
      );
    }
  }

  /**
   * Create new playlist
   */
  async createPlaylist(
    userId: string,
    data: CreatePlaylistDTO,
  ): Promise<PlaylistResponse> {
    try {
      const { data: playlist, error } = await supabaseAdmin
        .from("playlists")
        .insert({
          name: data.name,
          description: data.description,
          owner_id: userId,
          visibility: data.visibility,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info("Playlist created", { playlistId: playlist.id, userId });
      return formatPlaylistResponse(playlist, 0);
    } catch (error) {
      logger.error("Failed to create playlist", { error, userId });
      throw new AppError(
        500,
        "Failed to create playlist",
        "PLAYLIST_CREATE_ERROR",
      );
    }
  }

  /**
   * Update playlist metadata
   */
  async updatePlaylist(
    playlistId: string,
    userId: string,
    data: UpdatePlaylistDTO,
  ): Promise<PlaylistResponse> {
    try {
      // Only owner can update playlist metadata
      await this.permissions.checkOwnership(playlistId, userId);

      const { data: playlist, error } = await supabaseAdmin
        .from("playlists")
        .update({
          name: data.name,
          description: data.description,
          visibility: data.visibility,
        })
        .eq("id", playlistId)
        .select()
        .single();

      if (error) throw error;

      // Get track count
      const { count } = await supabaseAdmin
        .from("playlist_tracks")
        .select("*", { count: "exact", head: true })
        .eq("playlist_id", playlistId);

      logger.info("Playlist updated", { playlistId, userId });
      return formatPlaylistResponse(playlist, count || 0);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Failed to update playlist", { error, playlistId });
      throw new AppError(
        500,
        "Failed to update playlist",
        "PLAYLIST_UPDATE_ERROR",
      );
    }
  }

  /**
   * Delete playlist
   */
  async deletePlaylist(playlistId: string, userId: string): Promise<void> {
    try {
      // Only owner can delete playlist
      await this.permissions.checkOwnership(playlistId, userId);

      const { error } = await supabaseAdmin
        .from("playlists")
        .delete()
        .eq("id", playlistId);

      if (error) throw error;

      logger.info("Playlist deleted", { playlistId, userId });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Failed to delete playlist", { error, playlistId });
      throw new AppError(
        500,
        "Failed to delete playlist",
        "PLAYLIST_DELETE_ERROR",
      );
    }
  }
}
