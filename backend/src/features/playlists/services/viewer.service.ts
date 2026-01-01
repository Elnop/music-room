import { supabaseAdmin } from "@/shared/config/supabase.js";
import { AppError } from "@/shared/middleware/error-handler.js";
import { logger } from "@/shared/utils/logger.js";
import { fetchSingle } from "@/shared/utils/database.helpers.js";
import { checkOwnership } from "@/features/playlists/permissions/playlist.permissions.js";

/**
 * Service for managing playlist viewers (read-only access to private playlists)
 */
export class ViewerService {

  /**
   * Add viewer to playlist (allows viewing private playlist)
   */
  async addViewer(
    playlistId: string,
    userId: string,
    viewerId: string,
  ): Promise<void> {
    try {
      await checkOwnership(playlistId, userId);

      await fetchSingle<{ id: string }>(
        supabaseAdmin,
        "user_profiles",
        { id: viewerId },
        "id",
        "User not found",
        "USER_NOT_FOUND"
      );

      const playlist = await fetchSingle<{
        viewer_ids: string[] | null;
        collaborator_ids: string[] | null;
        owner_id: string;
      }>(
        supabaseAdmin,
        "playlists",
        { id: playlistId },
        "viewer_ids, collaborator_ids, owner_id",
        "Playlist not found",
        "PLAYLIST_NOT_FOUND"
      );

      if (playlist.owner_id === viewerId) {
        throw new AppError(
          400,
          "Owner cannot be added as viewer",
          "OWNER_CANNOT_BE_VIEWER",
        );
      }

      // Check if already a collaborator (editors don't need viewer access)
      if ((playlist.collaborator_ids ?? []).includes(viewerId)) {
        throw new AppError(
          409,
          "User is already a collaborator with edit access",
          "ALREADY_COLLABORATOR",
        );
      }

      if ((playlist.viewer_ids ?? []).includes(viewerId)) {
        throw new AppError(409, "User is already a viewer", "ALREADY_VIEWER");
      }

      const { error: updateError } = await supabaseAdmin
        .from("playlists")
        .update({
          viewer_ids: [...(playlist.viewer_ids ?? []), viewerId],
        })
        .eq("id", playlistId);

      if (updateError) throw updateError;

      logger.info("Viewer added to playlist", {
        playlistId,
        userId,
        viewerId,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Failed to add viewer", { error, playlistId });
      throw new AppError(500, "Failed to add viewer", "VIEWER_ADD_ERROR");
    }
  }

  /**
   * Remove viewer from playlist
   */
  async removeViewer(
    playlistId: string,
    userId: string,
    viewerId: string,
  ): Promise<void> {
    try {
      // Only owner can remove viewers
      await checkOwnership(playlistId, userId);

      // Get current playlist
      const playlist = await fetchSingle<{ viewer_ids: string[] | null }>(
        supabaseAdmin,
        "playlists",
        { id: playlistId },
        "viewer_ids",
        "Playlist not found",
        "PLAYLIST_NOT_FOUND"
      );

      // Remove viewer
      const { error: updateError } = await supabaseAdmin
        .from("playlists")
        .update({
          viewer_ids: (playlist.viewer_ids ?? []).filter(
            (id: string) => id !== viewerId,
          ),
        })
        .eq("id", playlistId);

      if (updateError) throw updateError;

      logger.info("Viewer removed from playlist", {
        playlistId,
        userId,
        viewerId,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Failed to remove viewer", { error, playlistId });
      throw new AppError(500, "Failed to remove viewer", "VIEWER_REMOVE_ERROR");
    }
  }

  /**
   * Get all viewers for a playlist with their profile info
   */
  async getViewers(
    playlistId: string,
    userId: string,
  ): Promise<
    Array<{
      id: string;
      username: string;
      displayName?: string;
      avatarUrl?: string;
    }>
  > {
    try {
      await checkOwnership(playlistId, userId);

      const playlist = await fetchSingle<{ viewer_ids: string[] | null }>(
        supabaseAdmin,
        "playlists",
        { id: playlistId },
        "viewer_ids",
        "Playlist not found",
        "PLAYLIST_NOT_FOUND"
      );

      if ((playlist.viewer_ids ?? []).length === 0) {
        return [];
      }

      const { data: viewers, error: viewersError } = await supabaseAdmin
        .from("user_profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", playlist.viewer_ids ?? []);

      if (viewersError) throw viewersError;

      return (viewers || []).map((v) => ({
        id: v.id,
        username: v.username,
        displayName: v.display_name ?? undefined,
        avatarUrl: v.avatar_url ?? undefined,
      }));
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Failed to get viewers", { error, playlistId });
      throw new AppError(500, "Failed to get viewers", "VIEWER_FETCH_ERROR");
    }
  }
}
