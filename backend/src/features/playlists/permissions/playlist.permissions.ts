import { supabaseAdmin } from "@/shared/config/supabase.js";
import { AppError } from "@/shared/middleware/error-handler.js";
import type { PlaylistRow } from "../playlist.types.js";

/**
 * Playlist permissions and authorization checks
 * 
 * Permission matrix based on subject requirements:
 * - Visibility (public/private): controls who can VIEW the playlist
 * - Edit mode (open/restricted): controls who can EDIT the playlist
 * 
 * | visibility | edit_mode   | Can VIEW                           | Can EDIT                    |
 * |------------|-------------|------------------------------------|-----------------------------|
 * | public     | open        | Everyone                           | Everyone                    |
 * | public     | restricted  | Everyone                           | Owner + Collaborators       |
 * | private    | open        | Owner + Viewers + Collaborators    | Owner + Viewers + Collabs   |
 * | private    | restricted  | Owner + Viewers + Collaborators    | Owner + Collaborators       |
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
   * Check if user can edit playlist based on edit_mode
   * 
   * - Owner can always edit
   * - In 'open' mode: anyone who can view can also edit
   * - In 'restricted' mode: only owner + collaborators can edit
   */
  canEditPlaylist(playlist: PlaylistRow, userId: string): boolean {
    if (playlist.owner_id === userId) {
      return true;
    }

    if (playlist.collaborator_ids.includes(userId)) {
      return true;
    }

    if (playlist.edit_mode === "open") {
      return this.canViewPlaylist(playlist, userId);
    }

    return false;
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
   * Check if user can edit playlist (throws if not)
   * Uses edit_mode to determine permissions
   */
  async checkEditPermission(playlistId: string, userId: string): Promise<void> {
    const { data: playlist, error } = await supabaseAdmin
      .from("playlists")
      .select("owner_id, collaborator_ids, viewer_ids, visibility, edit_mode")
      .eq("id", playlistId)
      .single();

    if (error || !playlist) {
      throw new AppError(404, "Playlist not found", "PLAYLIST_NOT_FOUND");
    }

    if (!this.canEditPlaylist(playlist as PlaylistRow, userId)) {
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

  /**
   * Fetch full playlist for permission checks
   */
  async getPlaylistForPermissionCheck(
    playlistId: string
  ): Promise<PlaylistRow> {
    const { data: playlist, error } = await supabaseAdmin
      .from("playlists")
      .select("*")
      .eq("id", playlistId)
      .single();

    if (error || !playlist) {
      throw new AppError(404, "Playlist not found", "PLAYLIST_NOT_FOUND");
    }

    return playlist as PlaylistRow;
  }
}
