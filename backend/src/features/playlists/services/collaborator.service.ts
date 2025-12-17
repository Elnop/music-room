import { supabaseAdmin } from "@/shared/config/supabase.js";
import { AppError } from "@/shared/middleware/error-handler.js";
import { logger } from "@/shared/utils/logger.js";
import { PlaylistPermissions } from "../permissions/playlist.permissions.js";

/**
 * Service for managing playlist collaborators
 */
export class CollaboratorService {
  private permissions: PlaylistPermissions;

  constructor() {
    this.permissions = new PlaylistPermissions();
  }

  /**
   * Add collaborator to playlist
   */
  async addCollaborator(
    playlistId: string,
    userId: string,
    collaboratorId: string,
  ): Promise<void> {
    try {
      // Only owner can add collaborators
      await this.permissions.checkOwnership(playlistId, userId);

      // Verify collaborator exists
      const { data: user, error: userError } = await supabaseAdmin
        .from("user_profiles")
        .select("id")
        .eq("id", collaboratorId)
        .single();

      if (userError || !user) {
        throw new AppError(404, "User not found", "USER_NOT_FOUND");
      }

      // Get current playlist
      const { data: playlist, error: playlistError } = await supabaseAdmin
        .from("playlists")
        .select("collaborator_ids")
        .eq("id", playlistId)
        .single();

      if (playlistError || !playlist) {
        throw new AppError(404, "Playlist not found", "PLAYLIST_NOT_FOUND");
      }

      // Check if already collaborator
      if (playlist.collaborator_ids.includes(collaboratorId)) {
        throw new AppError(
          409,
          "User is already a collaborator",
          "ALREADY_COLLABORATOR",
        );
      }

      // Add collaborator
      const { error: updateError } = await supabaseAdmin
        .from("playlists")
        .update({
          collaborator_ids: [...playlist.collaborator_ids, collaboratorId],
        })
        .eq("id", playlistId);

      if (updateError) throw updateError;

      logger.info("Collaborator added to playlist", {
        playlistId,
        userId,
        collaboratorId,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Failed to add collaborator", { error, playlistId });
      throw new AppError(
        500,
        "Failed to add collaborator",
        "COLLABORATOR_ADD_ERROR",
      );
    }
  }

  /**
   * Remove collaborator from playlist
   */
  async removeCollaborator(
    playlistId: string,
    userId: string,
    collaboratorId: string,
  ): Promise<void> {
    try {
      // Only owner can remove collaborators
      await this.permissions.checkOwnership(playlistId, userId);

      // Get current playlist
      const { data: playlist, error: playlistError } = await supabaseAdmin
        .from("playlists")
        .select("collaborator_ids")
        .eq("id", playlistId)
        .single();

      if (playlistError || !playlist) {
        throw new AppError(404, "Playlist not found", "PLAYLIST_NOT_FOUND");
      }

      // Remove collaborator
      const { error: updateError } = await supabaseAdmin
        .from("playlists")
        .update({
          collaborator_ids: playlist.collaborator_ids.filter(
            (id) => id !== collaboratorId,
          ),
        })
        .eq("id", playlistId);

      if (updateError) throw updateError;

      logger.info("Collaborator removed from playlist", {
        playlistId,
        userId,
        collaboratorId,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Failed to remove collaborator", { error, playlistId });
      throw new AppError(
        500,
        "Failed to remove collaborator",
        "COLLABORATOR_REMOVE_ERROR",
      );
    }
  }
}
