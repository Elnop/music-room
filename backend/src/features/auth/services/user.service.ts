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
    baseName: string,
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
   * Create session for OAuth user using Admin Magic Link API
   * This method does NOT modify user passwords - safe for all user types
   * @param email - User email
   * @returns Supabase session with access and refresh tokens
   */
  private static async createSessionForOAuthUser(
    email: string,
  ): Promise<Session> {
    try {
      // Step 1: Generate magic link using admin API
      // This creates a temporary token WITHOUT modifying user password
      const { data: linkData, error: linkError } =
        await supabase.auth.admin.generateLink({
          type: "magiclink",
          email,
        });

      if (linkError || !linkData) {
        logger.error("Failed to generate magic link for OAuth user", {
          email,
          error: linkError,
        });
        throw new AppError(
          500,
          "Failed to generate session link",
          "SESSION_LINK_GENERATION_FAILED",
        );
      }

      // Step 2: Extract hashed token from response
      const { hashed_token } = linkData.properties;

      if (!hashed_token) {
        logger.error("Magic link response missing hashed_token", {
          email,
          properties: linkData.properties,
        });
        throw new AppError(
          500,
          "Invalid magic link response",
          "INVALID_MAGIC_LINK_RESPONSE",
        );
      }

      // Step 3: Verify the token hash to obtain session
      // This exchanges the hashed_token for a full session with tokens
      const { data: verifyData, error: verifyError } =
        await supabase.auth.verifyOtp({
          token_hash: hashed_token,
          type: "email",
        });

      if (verifyError || !verifyData.session) {
        logger.error("Failed to verify OTP and create session", {
          email,
          error: verifyError,
        });
        throw new AppError(
          500,
          "Failed to create session from magic link",
          "SESSION_VERIFICATION_FAILED",
        );
      }

      return verifyData.session;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error("Unexpected error creating OAuth session", {
        email,
        error,
      });
      throw new AppError(
        500,
        "Failed to create OAuth session",
        "OAUTH_SESSION_ERROR",
      );
    }
  }

  /**
   * Create or retrieve OAuth user
   * @param provider - OAuth provider ('google' | 'facebook')
   * @param providerId - Provider-specific user ID (Google sub claim, Facebook user ID)
   * @param email - User email
   * @param profile - OAuth profile data
   * @returns User profile and session
   */
  static async createOAuthUser(
    provider: "google" | "facebook",
    providerId: string,
    email: string,
    profile: any, // GoogleProfile | FacebookProfile
  ): Promise<{ userProfile: UserProfile; session: Session }> {
    try {
      const providerColumn = `${provider}_id`; // 'google_id' or 'facebook_id'

      // 1. Check if OAuth provider ID already exists
      const { data: existingOAuth } = await supabase
        .from("user_profiles")
        .select("*")
        .eq(providerColumn, providerId)
        .single();

      if (existingOAuth) {
        // User exists, create session
        const session = await this.createSessionForOAuthUser(email);

        return {
          userProfile: existingOAuth,
          session,
        };
      }

      // 2. Check if email exists (link provider to existing account)
      const { data: authUser } = await supabase.auth.admin.listUsers();
      const existingUser = authUser?.users.find((u) => u.email === email);

      if (existingUser) {
        const { data: existingProfile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", existingUser.id)
          .single();

        if (existingProfile) {
          // Check if this provider is already linked to the account
          if (existingProfile[providerColumn]) {
            // Provider already linked, just create session
            const session = await this.createSessionForOAuthUser(email);
            return {
              userProfile: existingProfile as UserProfile,
              session,
            };
          }

          // Update profile with OAuth provider ID (additive - doesn't overwrite other providers)
          const { error: updateError } = await supabase
            .from("user_profiles")
            .update({
              [providerColumn]: providerId,
              avatar_url: profile.picture || existingProfile.avatar_url,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingProfile.id);

          if (updateError) {
            logger.error("Failed to update profile with OAuth provider", {
              error: updateError,
            });
          }

          // Create session for existing user
          const session = await this.createSessionForOAuthUser(email);

          return {
            userProfile: existingProfile as UserProfile,
            session,
          };
        }
      }

      // 3. Create new OAuth user
      const username = await this.generateUniqueUsername(
        profile.name || email.split("@")[0],
      );

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
          "USER_CREATION_FAILED",
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
            [providerColumn]: providerId,
            email_verified: true, // OAuth email verified by provider
          })
          .select()
          .single();

        if (profileError) {
          // Check if it's a unique constraint violation (username collision)
          if (profileError.code === "23505") {
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
            "PROFILE_CREATION_FAILED",
          );
        }

        if (!userProfile) {
          throw new AppError(
            500,
            "Profile creation returned no data",
            "PROFILE_CREATION_FAILED",
          );
        }

        // Generate session
        const session = await this.createSessionForOAuthUser(email);

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
        "OAUTH_USER_CREATION_ERROR",
      );
    }
  }
}
