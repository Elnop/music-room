import { supabase } from "@/shared/config/supabase.js";
import { AppError } from "@/shared/middleware/error-handler.js";
import { logger } from "@/shared/utils/logger.js";
import type {
  UpdateProfileDTO,
  ProfileUpdateResponse,
} from "./profile.types.js";

export class ProfileService {
  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: UpdateProfileDTO,
  ): Promise<ProfileUpdateResponse> {
    try {
      logger.info("Updating user profile", { userId, data });

      // Build update object with only provided fields
      const updateData: Record<string, any> = {};
      if (data.displayName !== undefined)
        updateData.display_name = data.displayName;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
      updateData.updated_at = new Date().toISOString();

      // Update user_profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("id", userId)
        .select("*")
        .single();

      if (profileError) {
        logger.error("Failed to update profile", {
          userId,
          error: profileError,
        });
        throw new AppError(
          500,
          "Failed to update profile",
          "PROFILE_UPDATE_ERROR",
        );
      }

      if (!profileData) {
        throw new AppError(404, "Profile not found", "PROFILE_NOT_FOUND");
      }

      // Get user email from auth.users
      const { data: userData, error: userError } =
        await supabase.auth.admin.getUserById(userId);

      if (userError || !userData.user) {
        logger.error("Failed to fetch user data", { userId, error: userError });
        throw new AppError(404, "User not found", "USER_NOT_FOUND");
      }

      logger.info("Profile updated successfully", { userId });

      return {
        id: profileData.id,
        email: userData.user.email!,
        username: profileData.username,
        displayName: profileData.display_name,
        avatarUrl: profileData.avatar_url,
        bio: profileData.bio,
        createdAt: profileData.created_at,
        updatedAt: profileData.updated_at,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Unexpected error during profile update", { error });
      throw new AppError(500, "Profile update failed", "PROFILE_UPDATE_ERROR");
    }
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<ProfileUpdateResponse> {
    try {
      logger.info("Fetching user profile", { userId });

      // Get profile from user_profiles
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError || !profileData) {
        logger.error("Profile not found", { userId, error: profileError });
        throw new AppError(404, "Profile not found", "PROFILE_NOT_FOUND");
      }

      // Get user email from auth.users
      const { data: userData, error: userError } =
        await supabase.auth.admin.getUserById(userId);

      if (userError || !userData.user) {
        logger.error("User not found", { userId, error: userError });
        throw new AppError(404, "User not found", "USER_NOT_FOUND");
      }

      return {
        id: profileData.id,
        email: userData.user.email!,
        username: profileData.username,
        displayName: profileData.display_name,
        avatarUrl: profileData.avatar_url,
        bio: profileData.bio,
        createdAt: profileData.created_at,
        updatedAt: profileData.updated_at,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Unexpected error fetching profile", { error });
      throw new AppError(500, "Failed to fetch profile", "PROFILE_FETCH_ERROR");
    }
  }
}
