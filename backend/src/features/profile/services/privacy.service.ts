import { supabase } from "@/shared/config/supabase.js";
import { AppError } from "@/shared/middleware/error-handler.js";
import { logger } from "@/shared/utils/logger.js";
import type {
  ProfilePrivacy,
  UpdatePrivacyDTO,
  ProfilePrivacyRow,
  VisibilityLevel,
  FilteredProfile,
  MusicGenre,
} from "../profile.types.js";

export class PrivacyService {
  /**
   * Get privacy settings for a user
   */
  async getPrivacySettings(userId: string): Promise<ProfilePrivacy> {
    try {
      logger.info("Fetching privacy settings", { userId });

      const { data, error } = await supabase
        .from("profile_privacy")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        // If no record exists, create default settings
        if (error.code === "PGRST116") {
          return await this.createDefaultSettings(userId);
        }
        logger.error("Failed to fetch privacy settings", { error });
        throw new AppError(
          500,
          "Failed to fetch privacy settings",
          "PRIVACY_FETCH_ERROR"
        );
      }

      return this.mapRowToPrivacy(data as ProfilePrivacyRow);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Unexpected error fetching privacy settings", { error });
      throw new AppError(
        500,
        "Failed to fetch privacy settings",
        "PRIVACY_FETCH_ERROR"
      );
    }
  }

  /**
   * Update privacy settings for a user
   */
  async updatePrivacySettings(
    userId: string,
    data: UpdatePrivacyDTO
  ): Promise<ProfilePrivacy> {
    try {
      logger.info("Updating privacy settings", { userId, data });

      // Build update object with snake_case keys
      const updateData: Record<string, VisibilityLevel | string> = {};
      if (data.emailVisibility !== undefined) {
        updateData.email_visibility = data.emailVisibility;
      }
      if (data.bioVisibility !== undefined) {
        updateData.bio_visibility = data.bioVisibility;
      }
      if (data.avatarVisibility !== undefined) {
        updateData.avatar_visibility = data.avatarVisibility;
      }
      if (data.musicPreferencesVisibility !== undefined) {
        updateData.music_preferences_visibility =
          data.musicPreferencesVisibility;
      }
      updateData.updated_at = new Date().toISOString();

      const { data: updatedData, error } = await supabase
        .from("profile_privacy")
        .update(updateData)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error) {
        // If no record exists, create with provided settings
        if (error.code === "PGRST116") {
          return await this.createDefaultSettings(userId, data);
        }
        logger.error("Failed to update privacy settings", { error });
        throw new AppError(
          500,
          "Failed to update privacy settings",
          "PRIVACY_UPDATE_ERROR"
        );
      }

      logger.info("Privacy settings updated successfully", { userId });
      return this.mapRowToPrivacy(updatedData as ProfilePrivacyRow);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Unexpected error updating privacy settings", { error });
      throw new AppError(
        500,
        "Failed to update privacy settings",
        "PRIVACY_UPDATE_ERROR"
      );
    }
  }

  /**
   * Create default privacy settings for a user
   */
  private async createDefaultSettings(
    userId: string,
    initialData?: UpdatePrivacyDTO
  ): Promise<ProfilePrivacy> {
    try {
      const insertData = {
        user_id: userId,
        email_visibility: initialData?.emailVisibility || "private",
        bio_visibility: initialData?.bioVisibility || "public",
        avatar_visibility: initialData?.avatarVisibility || "public",
        music_preferences_visibility:
          initialData?.musicPreferencesVisibility || "public",
      };

      const { data, error } = await supabase
        .from("profile_privacy")
        .insert(insertData)
        .select("*")
        .single();

      if (error) {
        logger.error("Failed to create default privacy settings", { error });
        throw new AppError(
          500,
          "Failed to create privacy settings",
          "PRIVACY_CREATE_ERROR"
        );
      }

      return this.mapRowToPrivacy(data as ProfilePrivacyRow);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Unexpected error creating privacy settings", { error });
      throw new AppError(
        500,
        "Failed to create privacy settings",
        "PRIVACY_CREATE_ERROR"
      );
    }
  }

  /**
   * Check if a field is visible to a viewer
   */
  isFieldVisible(
    visibility: VisibilityLevel,
    isOwnProfile: boolean,
    isFriend: boolean
  ): boolean {
    if (isOwnProfile) return true;

    switch (visibility) {
      case "public":
        return true;
      case "friends_only":
        return isFriend;
      case "private":
        return false;
      default:
        return false;
    }
  }

  /**
   * Get a profile with fields filtered by privacy settings
   */
  async getFilteredProfile(
    viewerId: string | null,
    targetUserId: string
  ): Promise<FilteredProfile> {
    try {
      const isOwnProfile = viewerId === targetUserId;

      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", targetUserId)
        .single();

      if (profileError || !profileData) {
        throw new AppError(404, "Profile not found", "PROFILE_NOT_FOUND");
      }

      // Get privacy settings
      const privacy = await this.getPrivacySettings(targetUserId);

      // Check friendship status if viewer is logged in
      let isFriend = false;
      if (viewerId && !isOwnProfile) {
        isFriend = await this.checkFriendship(viewerId, targetUserId);
      }

      // Get music preferences
      const { data: musicPrefsData } = await supabase
        .from("music_preferences")
        .select("genres")
        .eq("user_id", targetUserId)
        .single();

      // Get email if own profile or visible
      let email: string | null = null;
      if (
        isOwnProfile ||
        this.isFieldVisible(privacy.emailVisibility, isOwnProfile, isFriend)
      ) {
        const { data: userData } =
          await supabase.auth.admin.getUserById(targetUserId);
        email = userData?.user?.email || null;
      }

      // Build filtered profile
      // Use undefined (omitted from JSON) for hidden fields
      // Use actual value (even if null/empty) for visible fields
      const filteredProfile: FilteredProfile = {
        id: profileData.id,
        username: profileData.username,
        displayName: profileData.display_name,
        favoriteArtist: profileData.favorite_artist,
        createdAt: profileData.created_at,
        isOwnProfile,
        isFriend,
      };

      // Privacy-filtered fields: only include if visible
      // This way frontend can distinguish:
      // - field missing (undefined) = hidden by privacy
      // - field present with null/empty = visible but not filled

      // Avatar visibility
      if (
        this.isFieldVisible(privacy.avatarVisibility, isOwnProfile, isFriend)
      ) {
        filteredProfile.avatarUrl = profileData.avatar_url;
      }

      // Bio visibility
      if (
        this.isFieldVisible(privacy.bioVisibility, isOwnProfile, isFriend)
      ) {
        filteredProfile.bio = profileData.bio || "";
      }

      // Email visibility
      if (
        this.isFieldVisible(privacy.emailVisibility, isOwnProfile, isFriend)
      ) {
        filteredProfile.email = email;
      }

      // Music preferences visibility
      if (
        this.isFieldVisible(
          privacy.musicPreferencesVisibility,
          isOwnProfile,
          isFriend
        )
      ) {
        filteredProfile.musicPreferences =
          (musicPrefsData?.genres as MusicGenre[]) || [];
      }

      return filteredProfile;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Unexpected error getting filtered profile", { error });
      throw new AppError(
        500,
        "Failed to get profile",
        "PROFILE_FETCH_ERROR"
      );
    }
  }

  /**
   * Check if two users are mutual friends
   */
  private async checkFriendship(
    userId1: string,
    userId2: string
  ): Promise<boolean> {
    try {
      // Check if both users follow each other
      const { data: follows } = await supabase
        .from("follows")
        .select("follower_id, following_id")
        .or(
          `and(follower_id.eq.${userId1},following_id.eq.${userId2}),and(follower_id.eq.${userId2},following_id.eq.${userId1})`
        );

      if (!follows || follows.length < 2) {
        return false;
      }

      // Check for mutual follow
      const user1FollowsUser2 = follows.some(
        (f) => f.follower_id === userId1 && f.following_id === userId2
      );
      const user2FollowsUser1 = follows.some(
        (f) => f.follower_id === userId2 && f.following_id === userId1
      );

      return user1FollowsUser2 && user2FollowsUser1;
    } catch (error) {
      logger.warn("Error checking friendship, defaulting to false", { error });
      return false;
    }
  }

  /**
   * Map database row to ProfilePrivacy
   */
  private mapRowToPrivacy(row: ProfilePrivacyRow): ProfilePrivacy {
    return {
      userId: row.user_id,
      emailVisibility: row.email_visibility,
      bioVisibility: row.bio_visibility,
      avatarVisibility: row.avatar_visibility,
      musicPreferencesVisibility: row.music_preferences_visibility,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

