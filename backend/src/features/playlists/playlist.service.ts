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
   * Get all playlists for a user (owned + collaborating + viewing)
   */
  async getUserPlaylists(userId: string): Promise<PlaylistResponse[]> {
    try {
      const { data: playlists, error } = await supabaseAdmin
        .from("playlists")
        .select("*")
        .or(
          `owner_id.eq.${userId},collaborator_ids.cs.{${userId}},viewer_ids.cs.{${userId}}`
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (playlists.length === 0) {
        return [];
      }

      const playlistIds = playlists.map((p) => p.id);

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
        {} as Record<string, number>
      );

      const { data: firstTracks, error: firstTracksError } = await supabaseAdmin
        .from("playlist_tracks")
        .select("playlist_id, tracks:track_id(album_art)")
        .in("playlist_id", playlistIds)
        .eq("position", 0);

      if (firstTracksError) throw firstTracksError;

      const firstTrackCoverMap = (firstTracks || []).reduce(
        (acc, row) => {
          const track = row.tracks as { album_art?: string } | null;
          if (track?.album_art) {
            acc[row.playlist_id] = track.album_art;
          }
          return acc;
        },
        {} as Record<string, string>
      );

      // Get owner info for all playlists
      const ownerIds = [...new Set(playlists.map((p) => p.owner_id))];
      const { data: owners, error: ownersError } = await supabaseAdmin
        .from("user_profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", ownerIds);

      if (ownersError) throw ownersError;

      const ownerMap = (owners || []).reduce(
        (acc, owner) => {
          acc[owner.id] = {
            id: owner.id,
            username: owner.username,
            displayName: owner.display_name,
            avatarUrl: owner.avatar_url,
          };
          return acc;
        },
        {} as Record<
          string,
          {
            id: string;
            username: string;
            displayName?: string;
            avatarUrl?: string;
          }
        >
      );

      return playlists.map((p) =>
        formatPlaylistResponse(
          p,
          countMap[p.id] || 0,
          ownerMap[p.owner_id],
          firstTrackCoverMap[p.id]
        )
      );
    } catch (error) {
      logger.error("Failed to get user playlists", { error, userId });
      throw new AppError(
        500,
        "Failed to fetch playlists",
        "PLAYLIST_FETCH_ERROR"
      );
    }
  }

  /**
   * Get playlists for a specific user's profile
   * Returns public playlists + private playlists where current user is invited
   */
  async getPlaylistsByUser(
    targetUserId: string,
    currentUserId?: string
  ): Promise<PlaylistResponse[]> {
    try {
      let query = supabaseAdmin
        .from("playlists")
        .select("*")
        .eq("owner_id", targetUserId);

      if (currentUserId) {
        query = query.or(
          `visibility.eq.public,and(visibility.eq.private,or(viewer_ids.cs.{${currentUserId}},collaborator_ids.cs.{${currentUserId}}))`
        );
      } else {
        query = query.eq("visibility", "public");
      }

      const { data: playlists, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      if (!playlists || playlists.length === 0) {
        return [];
      }

      const playlistIds = playlists.map((p) => p.id);
      const { data: trackCounts, error: countError } = await supabaseAdmin
        .from("playlist_tracks")
        .select("playlist_id")
        .in("playlist_id", playlistIds);

      if (countError) throw countError;

      const countMap = (trackCounts || []).reduce(
        (acc, row) => {
          acc[row.playlist_id] = (acc[row.playlist_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const { data: firstTracks, error: firstTracksError } = await supabaseAdmin
        .from("playlist_tracks")
        .select("playlist_id, tracks:track_id(album_art)")
        .in("playlist_id", playlistIds)
        .eq("position", 0);

      if (firstTracksError) throw firstTracksError;

      const firstTrackCoverMap = (firstTracks || []).reduce(
        (acc, row) => {
          const track = row.tracks as { album_art?: string } | null;
          if (track?.album_art) {
            acc[row.playlist_id] = track.album_art;
          }
          return acc;
        },
        {} as Record<string, string>
      );

      const { data: owner, error: ownerError } = await supabaseAdmin
        .from("user_profiles")
        .select("id, username, display_name, avatar_url")
        .eq("id", targetUserId)
        .single();

      if (ownerError) throw ownerError;

      const ownerInfo = owner
        ? {
            id: owner.id,
            username: owner.username,
            displayName: owner.display_name,
            avatarUrl: owner.avatar_url,
          }
        : undefined;

      return playlists.map((p) =>
        formatPlaylistResponse(
          p,
          countMap[p.id] || 0,
          ownerInfo,
          firstTrackCoverMap[p.id]
        )
      );
    } catch (error) {
      logger.error("Failed to get user playlists", { error, targetUserId });
      throw new AppError(
        500,
        "Failed to fetch playlists",
        "PLAYLIST_FETCH_ERROR"
      );
    }
  }

  /**
   * Get playlist by ID with full track data
   */
  async getPlaylistById(
    playlistId: string,
    userId?: string
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
        `
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
        "PLAYLIST_FETCH_ERROR"
      );
    }
  }

  /**
   * Create new playlist
   */
  async createPlaylist(
    userId: string,
    data: CreatePlaylistDTO
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
        "PLAYLIST_CREATE_ERROR"
      );
    }
  }

  /**
   * Update playlist metadata
   */
  async updatePlaylist(
    playlistId: string,
    userId: string,
    data: UpdatePlaylistDTO
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
        "PLAYLIST_UPDATE_ERROR"
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
        "PLAYLIST_DELETE_ERROR"
      );
    }
  }
}
