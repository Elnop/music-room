import { supabase } from "@/shared/config/supabase.js";
import { AppError } from "@/shared/middleware/error-handler.js";
import { logger } from "@/shared/utils/logger.js";
import type { AuthResponse, UserProfile } from "../auth.types.js";
import type { User, Session } from "@supabase/supabase-js";

/**
 * Format auth response with user and session data
 */
export function formatAuthResponse(
  user: User,
  session: Session,
  username: string,
  displayName?: string,
  avatarUrl?: string,
  bio?: string,
  createdAt?: string,
  updatedAt?: string,
): AuthResponse {
  return {
    user: {
      id: user.id,
      email: user.email,
      username,
      displayName,
      avatarUrl,
      bio,
      createdAt: createdAt || new Date().toISOString(),
      updatedAt: updatedAt || new Date().toISOString(),
    },
    session: {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
      expiresAt: session.expires_at,
    },
  };
}

/**
 * Fetch user profile from database
 */
export async function fetchUserProfile(userId: string): Promise<{
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}> {
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("username, display_name, avatar_url, bio, created_at, updated_at")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    logger.error("Failed to fetch user profile", {
      userId,
      error: profileError,
    });
    throw new AppError(500, "Failed to fetch user profile", "PROFILE_ERROR");
  }

  return profile;
}

/**
 * Get complete user profile by ID (auth + profile)
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  try {
    const { data: user, error: userError } =
      await supabase.auth.admin.getUserById(userId);

    if (userError || !user.user) {
      throw new AppError(404, "User not found", "USER_NOT_FOUND");
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      throw new AppError(404, "User profile not found", "PROFILE_NOT_FOUND");
    }

    return {
      id: user.user.id,
      email: user.user.email ?? "",
      username: profile.username,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      bio: profile.bio,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, "Failed to get user profile", "PROFILE_ERROR");
  }
}
