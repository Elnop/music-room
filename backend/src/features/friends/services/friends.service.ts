import { supabase } from "@/shared/config/supabase.js";
import { AppError } from "@/shared/middleware/error-handler.js";
import { logger } from "@/shared/utils/logger.js";
import type { FollowStatus, FollowActionResponse } from "../friends.types.js";

export class FriendsService {
  /**
   * Get follow status between current user and target user
   */
  async getFollowStatus(
    currentUserId: string,
    targetUserId: string
  ): Promise<FollowStatus> {
    try {
      const [
        followingResult,
        followedByResult,
        followersCountResult,
        followingCountResult,
      ] = await Promise.all([
        supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", currentUserId)
          .eq("following_id", targetUserId)
          .maybeSingle(),
        supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", targetUserId)
          .eq("following_id", currentUserId)
          .maybeSingle(),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", targetUserId),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", targetUserId),
      ]);

      if (followingResult.error) {
        logger.error("Failed to check following status", {
          error: followingResult.error,
        });
        throw new AppError(
          500,
          "Failed to get follow status",
          "FOLLOW_STATUS_ERROR"
        );
      }

      if (followedByResult.error) {
        logger.error("Failed to check followed by status", {
          error: followedByResult.error,
        });
        throw new AppError(
          500,
          "Failed to get follow status",
          "FOLLOW_STATUS_ERROR"
        );
      }

      const isFollowing = !!followingResult.data;
      const isFollowedBy = !!followedByResult.data;

      return {
        isFollowing,
        isFollowedBy,
        isFriend: isFollowing && isFollowedBy,
        followersCount: followersCountResult.count || 0,
        followingCount: followingCountResult.count || 0,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Unexpected error getting follow status", { error });
      throw new AppError(
        500,
        "Failed to get follow status",
        "FOLLOW_STATUS_ERROR"
      );
    }
  }

  /**
   * Get own stats (followers and following count)
   */
  async getMyStats(
    userId: string
  ): Promise<{ followersCount: number; followingCount: number }> {
    try {
      const [followersCountResult, followingCountResult] = await Promise.all([
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", userId),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", userId),
      ]);

      return {
        followersCount: followersCountResult.count || 0,
        followingCount: followingCountResult.count || 0,
      };
    } catch (error) {
      logger.error("Unexpected error getting my stats", { error });
      throw new AppError(500, "Failed to get stats", "STATS_ERROR");
    }
  }

  /**
   * Follow a user
   */
  async followUser(
    currentUserId: string,
    targetUserId: string
  ): Promise<FollowActionResponse> {
    try {
      // Prevent self-follow
      if (currentUserId === targetUserId) {
        throw new AppError(400, "Cannot follow yourself", "SELF_FOLLOW_ERROR");
      }

      const { data: targetUser, error: userError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", targetUserId)
        .maybeSingle();

      if (userError || !targetUser) {
        throw new AppError(404, "User not found", "USER_NOT_FOUND");
      }

      const { error: insertError } = await supabase.from("follows").insert({
        follower_id: currentUserId,
        following_id: targetUserId,
      });

      if (insertError) {
        if (insertError.code === "23505") {
          logger.info("Already following user", {
            currentUserId,
            targetUserId,
          });
        } else {
          logger.error("Failed to follow user", { error: insertError });
          throw new AppError(500, "Failed to follow user", "FOLLOW_ERROR");
        }
      }

      const status = await this.getFollowStatus(currentUserId, targetUserId);

      return { success: true, status };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Unexpected error following user", { error });
      throw new AppError(500, "Failed to follow user", "FOLLOW_ERROR");
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(
    currentUserId: string,
    targetUserId: string
  ): Promise<FollowActionResponse> {
    try {
      const { error: deleteError } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUserId);

      if (deleteError) {
        logger.error("Failed to unfollow user", { error: deleteError });
        throw new AppError(500, "Failed to unfollow user", "UNFOLLOW_ERROR");
      }

      const status = await this.getFollowStatus(currentUserId, targetUserId);

      return { success: true, status };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Unexpected error unfollowing user", { error });
      throw new AppError(500, "Failed to unfollow user", "UNFOLLOW_ERROR");
    }
  }

  /**
   * Get mutual friends (users who follow each other)
   */
  async getMutualFriends(userId: string): Promise<
    Array<{
      id: string;
      username: string;
      displayName?: string;
      avatarUrl?: string;
    }>
  > {
    try {
      // Get users I follow
      const { data: following, error: followingError } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId);

      if (followingError) {
        logger.error("Failed to get following list", { error: followingError });
        throw new AppError(500, "Failed to get friends", "FRIENDS_ERROR");
      }

      if (!following || following.length === 0) {
        return [];
      }

      const followingIds = following.map((f) => f.following_id);

      const { data: mutualFollows, error: mutualError } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", userId)
        .in("follower_id", followingIds);

      if (mutualError) {
        logger.error("Failed to get mutual follows", { error: mutualError });
        throw new AppError(500, "Failed to get friends", "FRIENDS_ERROR");
      }

      if (!mutualFollows || mutualFollows.length === 0) {
        return [];
      }

      const mutualIds = mutualFollows.map((f) => f.follower_id);

      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", mutualIds);

      if (profilesError) {
        logger.error("Failed to get friend profiles", { error: profilesError });
        throw new AppError(500, "Failed to get friends", "FRIENDS_ERROR");
      }

      return (profiles || []).map((p) => ({
        id: p.id,
        username: p.username,
        displayName: p.display_name ?? undefined,
        avatarUrl: p.avatar_url ?? undefined,
      }));
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Unexpected error getting mutual friends", { error });
      throw new AppError(500, "Failed to get friends", "FRIENDS_ERROR");
    }
  }
}
