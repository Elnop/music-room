import { supabase } from "../../../shared/config/supabase.js";
import { AppError } from "../../../shared/middleware/error-handler.js";
import { logger } from "../../../shared/utils/logger.js";
import type { UserProfile, GoogleProfile } from "../auth.types.js";
import type { Session } from "@supabase/supabase-js";

export class UserService {
  /**
   * Generate unique username from base name
   * @param baseName - Base name to generate username from (e.g., "John Doe")
   * @returns Unique username (e.g., "johndoe" or "johndoe1")
   */
  private static async generateUniqueUsername(
    baseName: string
  ): Promise<string> {
    // Sanitize: "John Doe" → "johndoe"
    let username = baseName.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Enforce min length (3 chars)
    if (username.length < 3) {
      username = `user${Date.now()}`;
    }

    // Check if base username is available
    const { data: existing } = await supabase
      .from("user_profiles")
      .select("username")
      .eq("username", username)
      .single();

    if (!existing) {
      return username;
    }

    // Append incrementing number
    for (let i = 1; i <= 999; i++) {
      const candidate = `${username}${i}`;
      const { data } = await supabase
        .from("user_profiles")
        .select("username")
        .eq("username", candidate)
        .single();

      if (!data) {
        return candidate;
      }
    }

    // Ultimate fallback (extremely rare)
    return `${username}${Date.now()}`;
  }

  /**
   * Create session for OAuth user using admin magic link method
   * @param email - User email
   * @returns Supabase session with access and refresh tokens
   */
  private static async createSessionForOAuthUser(
    email: string
  ): Promise<Session> {
    // Use admin API to generate magic link token
    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (linkError || !linkData) {
      logger.error("Failed to generate session for OAuth user", {
        error: linkError,
      });
      throw new AppError(
        500,
        "Failed to generate session",
        "SESSION_GENERATION_FAILED"
      );
    }

    // Verify the hashed token to get session
    const { data: sessionData, error: sessionError } =
      await supabase.auth.verifyOtp({
        email,
        token: linkData.properties.hashed_token,
        type: "magiclink",
      });

    if (sessionError || !sessionData.session) {
      logger.error("Failed to verify session token for OAuth user", {
        error: sessionError,
      });
      throw new AppError(
        500,
        "Failed to verify session token",
        "SESSION_VERIFICATION_FAILED"
      );
    }

    return sessionData.session;
  }

  /**
   * Create or retrieve OAuth user
   * @param provider - OAuth provider ('google')
   * @param providerId - Provider-specific user ID (Google sub claim)
   * @param email - User email
   * @param profile - OAuth profile data
   * @returns User profile and session
   */
  static async createOAuthUser(
    provider: "google",
    providerId: string,
    email: string,
    profile: GoogleProfile
  ): Promise<{ userProfile: UserProfile; session: Session }> {
    try {
      // 1. Check if OAuth provider ID already exists
      const { data: existingOAuth } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("oauth_provider_id", providerId)
        .eq("oauth_provider", provider)
        .single();

      if (existingOAuth) {
        logger.info("Existing OAuth user logging in", {
          userId: existingOAuth.id,
          provider,
        });

        // User exists, create session
        const session = await this.createSessionForOAuthUser(email);

        return {
          userProfile: existingOAuth,
          session,
        };
      }

      // 2. Check if email exists with different provider (conflict)
      const { data: authUser } = await supabase.auth.admin.listUsers();
      const existingUser = authUser?.users.find((u) => u.email === email);

      if (existingUser) {
        const { data: existingProfile } = await supabase
          .from("user_profiles")
          .select("oauth_provider")
          .eq("id", existingUser.id)
          .single();

        if (existingProfile && existingProfile.oauth_provider !== provider) {
          logger.warn("Email already in use with different provider", {
            email,
            existingProvider: existingProfile.oauth_provider,
            attemptedProvider: provider,
          });
          throw new AppError(409, "Email already in use", "EMAIL_IN_USE");
        }
      }

      // 3. Create new OAuth user
      const username = await this.generateUniqueUsername(
        profile.name || email.split("@")[0]
      );

      logger.info("Creating new OAuth user", {
        email,
        provider,
        username,
      });

      // Create Supabase Auth user (no password)
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email,
          email_confirm: true, // Auto-confirm (OAuth verified)
          user_metadata: {
            oauth_provider: provider,
            oauth_provider_id: providerId,
            display_name: profile.name,
            avatar_url: profile.picture || null,
          },
        });

      if (authError || !authData.user) {
        logger.error("Failed to create OAuth auth user", {
          error: authError,
        });
        throw new AppError(
          500,
          "Failed to create user",
          "USER_CREATION_FAILED"
        );
      }

      // Create user profile with race condition handling
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            id: authData.user.id,
            username,
            display_name: profile.name || username,
            avatar_url: profile.picture || null,
            oauth_provider: provider,
            oauth_provider_id: providerId,
            email_verified: true, // OAuth email verified by provider
          })
          .select()
          .single();

        if (profileError) {
          // Check if it's a unique constraint violation (username collision)
          if (profileError.code === "23505") {
            logger.warn("Username collision detected, retrying with new username", {
              username,
            });
            // Rollback auth user
            await supabase.auth.admin.deleteUser(authData.user.id);
            // Retry with new username
            return this.createOAuthUser(provider, providerId, email, profile);
          }

          logger.error("Failed to create user profile", {
            error: profileError,
          });
          // Rollback: delete the auth user
          await supabase.auth.admin.deleteUser(authData.user.id);
          throw new AppError(
            500,
            "Failed to create profile",
            "PROFILE_CREATION_FAILED"
          );
        }

        if (!userProfile) {
          throw new AppError(
            500,
            "Profile creation returned no data",
            "PROFILE_CREATION_FAILED"
          );
        }

        // Generate session
        const session = await this.createSessionForOAuthUser(email);

        logger.info("OAuth user created successfully", {
          userId: userProfile.id,
          provider,
          username: userProfile.username,
        });

        return {
          userProfile,
          session,
        };
      } catch (error) {
        // Cleanup auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw error;
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error("Unexpected error during OAuth user creation", { error });
      throw new AppError(
        500,
        "Failed to create OAuth user",
        "OAUTH_USER_CREATION_ERROR"
      );
    }
  }
}
