import { supabase } from "@/shared/config/supabase.js";
import { AppError } from "@/shared/middleware/error-handler.js";
import { logger } from "@/shared/utils/logger.js";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/shared/types/supabase.generated.js";
import type {
  ProfilePrivacy,
  UpdatePrivacyDTO,
  VisibilityLevel,
  FilteredProfile,
  MusicGenre,
} from "@/features/profile/profile.types.js";

// Use Supabase generated types
type ProfilePrivacyRow = Tables<"profile_privacy">;

export class PrivacyService {
  /**
   * Get privacy settings for a user
   * @param userId - The user whose privacy settings to fetch
   * @param requesterId - The user making the request (optional, used to determine if we can create defaults)
   */
  async getPrivacySettings(
    userId: string,
    requesterId?: string
  ): Promise<ProfilePrivacy> {
    try {
      logger.info("Fetching privacy settings", { userId, requesterId });

      const { data, error } = await supabase
        .from("profile_privacy")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        // If no record exists
        if (error.code === "PGRST116") {
          // Only create default settings if the requester is the user themselves
          if (requesterId && requesterId === userId) {
            return await this.createDefaultSettings(userId);
          }
          // For other users, return default settings without creating them
          return this.getDefaultPrivacySettings(userId);
        }
        logger.error("Failed to fetch privacy settings", { error });
        throw new AppError(
          500,
          "Failed to fetch privacy settings",
          "PRIVACY_FETCH_ERROR"
        );
      }

      return this.mapRowToPrivacy(data);
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
   * Get default privacy settings without creating them in database
   */
  private getDefaultPrivacySettings(userId: string): ProfilePrivacy {
    return {
      userId,
      emailVisibility: "private",
      bioVisibility: "public",
      avatarVisibility: "public",
      musicPreferencesVisibility: "public",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
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
      const updateData: TablesUpdate<"profile_privacy"> = {
        updated_at: new Date().toISOString(),
      };
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
      return this.mapRowToPrivacy(updatedData);
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
      const insertData: TablesInsert<"profile_privacy"> = {
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

      return this.mapRowToPrivacy(data);
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

      // Get privacy settings (pass viewerId to determine if we can create defaults)
      const privacy = await this.getPrivacySettings(
        targetUserId,
        viewerId ?? undefined
      );

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
      const filteredProfile: FilteredProfile = {
        id: profileData.id,
        username: profileData.username,
        displayName: profileData.display_name ?? undefined,
        favoriteArtist: profileData.favorite_artist ?? undefined,
        createdAt: profileData.created_at ?? new Date().toISOString(),
        isOwnProfile,
        isFriend,
      };

      // Privacy-filtered fields: only include if visible
      if (
        this.isFieldVisible(privacy.avatarVisibility, isOwnProfile, isFriend)
      ) {
        filteredProfile.avatarUrl = profileData.avatar_url ?? undefined;
      }

      if (this.isFieldVisible(privacy.bioVisibility, isOwnProfile, isFriend)) {
        filteredProfile.bio = profileData.bio || "";
      }

      if (
        this.isFieldVisible(privacy.emailVisibility, isOwnProfile, isFriend)
      ) {
        filteredProfile.email = email;
      }

      if (
        this.isFieldVisible(
          privacy.musicPreferencesVisibility,
          isOwnProfile,
          isFriend
        )
      ) {
        filteredProfile.musicPreferences = this.parseGenres(
          musicPrefsData?.genres
        );
      }

      return filteredProfile;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Unexpected error getting filtered profile", { error });
      throw new AppError(500, "Failed to get profile", "PROFILE_FETCH_ERROR");
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
      const { data: follows } = await supabase
        .from("follows")
        .select("follower_id, following_id")
        .in("follower_id", [userId1, userId2])
        .in("following_id", [userId1, userId2]);

      if (!follows || follows.length < 2) {
        return false;
      }

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
   * Type guard for MusicGenre validation
   */
  private isValidGenre(genre: string): genre is MusicGenre {
    const validGenres: readonly string[] = [
      "pop",
      "rock",
      "hiphop",
      "rnb",
      "jazz",
      "classical",
      "electronic",
      "country",
      "latin",
      "metal",
    ];
    return validGenres.includes(genre);
  }

  /**
   * Parse genres from database to typed array
   */
  private parseGenres(genres: string[] | null | undefined): MusicGenre[] {
    if (!genres || !Array.isArray(genres)) {
      return [];
    }
    return genres.filter((g): g is MusicGenre => this.isValidGenre(g));
  }

  /**
   * Map database row to ProfilePrivacy with null safety
   */
  private mapRowToPrivacy(row: ProfilePrivacyRow): ProfilePrivacy {
    return {
      userId: row.user_id,
      emailVisibility: row.email_visibility ?? "private",
      bioVisibility: row.bio_visibility ?? "public",
      avatarVisibility: row.avatar_visibility ?? "public",
      musicPreferencesVisibility: row.music_preferences_visibility ?? "public",
      createdAt: row.created_at ?? new Date().toISOString(),
      updatedAt: row.updated_at ?? new Date().toISOString(),
    };
  }
}
