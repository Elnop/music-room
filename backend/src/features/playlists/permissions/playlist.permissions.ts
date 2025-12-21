import { supabaseAdmin } from "@/shared/config/supabase.js";
import { AppError } from "@/shared/middleware/error-handler.js";
import type { PlaylistRow } from "../playlist.types.js";

/**
 * Playlist permissions and authorization checks
 */
export class PlaylistPermissions {
  /**
   * Check if user can view playlist
   */
  canViewPlaylist(playlist: PlaylistRow, userId: string): boolean {
    return (
      playlist.visibility === "public" ||
      playlist.owner_id === userId ||
      playlist.collaborator_ids.includes(userId) ||
      playlist.viewer_ids.includes(userId)
    );
  }

  /**
   * Check if user is owner (throws if not)
   */
  async checkOwnership(playlistId: string, userId: string): Promise<void> {
    const { data: playlist, error } = await supabaseAdmin
      .from("playlists")
      .select("owner_id")
      .eq("id", playlistId)
      .single();

    if (error || !playlist) {
      throw new AppError(404, "Playlist not found", "PLAYLIST_NOT_FOUND");
    }

    if (playlist.owner_id !== userId) {
      throw new AppError(403, "Access denied", "PLAYLIST_ACCESS_DENIED");
    }
  }

  /**
   * Check if user can edit playlist (owner or collaborator)
   */
  async checkEditPermission(playlistId: string, userId: string): Promise<void> {
    const { data: playlist, error } = await supabaseAdmin
      .from("playlists")
      .select("owner_id, collaborator_ids")
      .eq("id", playlistId)
      .single();

    if (error || !playlist) {
      throw new AppError(404, "Playlist not found", "PLAYLIST_NOT_FOUND");
    }

    if (
      playlist.owner_id !== userId &&
      !playlist.collaborator_ids.includes(userId)
    ) {
      throw new AppError(403, "Access denied", "PLAYLIST_ACCESS_DENIED");
    }
  }

  /**
   * Fetch playlist with owner check
   */
  async getPlaylistWithOwnerCheck(
    playlistId: string
  ): Promise<{ owner_id: string; collaborator_ids: string[] }> {
    const { data: playlist, error } = await supabaseAdmin
      .from("playlists")
      .select("owner_id, collaborator_ids")
      .eq("id", playlistId)
      .single();

    if (error || !playlist) {
      throw new AppError(404, "Playlist not found", "PLAYLIST_NOT_FOUND");
    }

    return playlist;
  }
}
