import { supabase } from "@/shared/config/supabase.js";
import { AppError } from "@/shared/middleware/error-handler.js";
import type { SupabaseUser, AuthResponse } from "../auth.types.js";
import { formatAuthResponse, fetchUserProfile } from "../utils/auth.helpers.js";

/**
 * Service for session and token management
 */
export class SessionService {
  /**
   * Verify JWT token and return user
   */
  async verifyToken(token: string): Promise<SupabaseUser> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        throw new AppError(401, "Invalid or expired token", "INVALID_TOKEN");
      }

      return {
        id: user.id,
        email: user.email ?? "",
        role: user.role,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(401, "Invalid token", "INVALID_TOKEN");
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session || !data.user) {
        throw new AppError(
          401,
          "Invalid or expired refresh token",
          "INVALID_REFRESH_TOKEN",
        );
      }

      const profile = await fetchUserProfile(data.user.id);

      return formatAuthResponse(
        data.user,
        data.session,
        profile.username,
        profile.display_name,
        profile.avatar_url,
        profile.bio,
        profile.created_at,
        profile.updated_at,
      );
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(401, "Token refresh failed", "REFRESH_ERROR");
    }
  }
}
