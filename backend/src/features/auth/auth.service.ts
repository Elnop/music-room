import { supabase } from "@/shared/config/supabase.js";
import { AppError } from "@/shared/middleware/error-handler.js";
import { logger } from "@/shared/utils/logger.js";
import {
  formatAuthResponse,
  fetchUserProfile,
  getUserProfile,
} from "@/features/auth/utils/auth.helpers.js";
import { SessionService } from "@/features/auth/services/session.service.js";
import { OAuthService } from "@/features/auth/services/oauth.service.js";
import { UserService } from "@/features/auth/services/user.service.js";
import { ProviderService } from "@/features/auth/services/provider.service.js";
import { EmailService } from "@/features/auth/services/email.service.js";
import { EmailVerificationService } from "@/features/auth/services/email-verification.service.js";
import type {
  RegisterDTO,
  LoginDTO,
  AuthResponse,
  UserProfile,
  SupabaseUser,
  LinkedProvidersResponse,
  OAuthProvider,
} from "@/features/auth/auth.types.js";

export class AuthService {
  private sessionService: SessionService;

  constructor() {
    this.sessionService = new SessionService();
  }
  /**
   * Register a new user
   */
  async register(data: RegisterDTO): Promise<AuthResponse> {
    try {
      logger.info("Registering new user", {
        email: data.email,
        username: data.username,
      });

      // 1. Check if email exists with unverified account
      // If exists and unverified, delete it to allow re-registration
      // This MUST be done BEFORE username check to clean up old username
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const userWithEmail = existingUser?.users?.find(
        (u) => u.email === data.email,
      );

      if (userWithEmail) {
        // Check if email is verified
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("email_verified")
          .eq("id", userWithEmail.id)
          .single();

        if (profile && !profile.email_verified) {
          logger.info(
            "Found unverified account with same email, deleting old account",
            {
              email: data.email,
              oldUserId: userWithEmail.id,
            },
          );

          // Delete old profile first (this removes the old username too)
          await supabase
            .from("user_profiles")
            .delete()
            .eq("id", userWithEmail.id);

          // Delete old auth user
          await supabase.auth.admin.deleteUser(userWithEmail.id);

          logger.info("Old unverified account deleted successfully", {
            email: data.email,
          });
        } else {
          // Email is verified, cannot re-register
          throw new AppError(
            409,
            "Email already registered",
            "EMAIL_ALREADY_EXISTS",
          );
        }
      }

      // 2. Check if username already exists (after cleanup)
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("username")
        .eq("username", data.username)
        .single();

      if (existingProfile) {
        throw new AppError(409, "Username already taken", "USERNAME_TAKEN");
      }

      // 3. Create user in Supabase Auth using Admin API
      // email_confirm: false requires email verification
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: false, // Require email verification
        });

      if (authError) {
        logger.error("Supabase auth signup error", { error: authError });
        throw new AppError(400, authError.message, "AUTH_ERROR");
      }

      if (!authData.user) {
        throw new AppError(
          400,
          "Failed to create user - no user returned",
          "AUTH_ERROR",
        );
      }

      // 3. Create user profile
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          id: authData.user.id,
          username: data.username,
          display_name: data.displayName,
        });

      if (profileError) {
        logger.error("Failed to create user profile", { error: profileError });
        // Rollback: delete the auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new AppError(
          500,
          "Failed to create user profile",
          "PROFILE_ERROR",
        );
      }

      // 4. Generate and send verification code
      const emailService = new EmailService();
      const verificationService = new EmailVerificationService();

      const code = await verificationService.generateAndStore(authData.user.id);
      await emailService.sendVerificationEmail(data.email, code);

      logger.info("User registered successfully, verification email sent", {
        userId: authData.user.id,
        email: data.email,
      });

      // Return response WITHOUT session (user must verify email first)
      return {
        user: {
          id: authData.user.id,
          email: data.email,
          username: data.username,
          displayName: data.displayName,
          avatarUrl: undefined,
          bio: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        requiresVerification: true,
        message:
          "Registration successful. Please check your email for verification code.",
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Unexpected error during registration", { error });
      throw new AppError(500, "Registration failed", "REGISTRATION_ERROR");
    }
  }

  /**
   * Login user with email and password
   */
  async login(data: LoginDTO): Promise<AuthResponse> {
    try {
      logger.info("User login attempt", { email: data.email });

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

      if (authError) {
        logger.warn("Login failed - auth error", {
          email: data.email,
          error: authError.message,
        });
        throw new AppError(
          401,
          "Invalid email or password",
          "INVALID_CREDENTIALS",
        );
      }

      if (!authData.user || !authData.session) {
        logger.error("Login failed - no user or session returned");
        throw new AppError(
          401,
          "Invalid email or password",
          "INVALID_CREDENTIALS",
        );
      }

      // Fetch user profile and check email verification
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*, email_verified, google_id, facebook_id")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        logger.error("Failed to fetch user profile", {
          userId: authData.user.id,
          error: profileError,
        });
        throw new AppError(404, "User profile not found", "PROFILE_NOT_FOUND");
      }

      // Check if email/password user has verified email
      // OAuth accounts (Google/Facebook) are auto-verified
      const isOAuthAccount = profile.google_id || profile.facebook_id;
      if (!isOAuthAccount && !profile.email_verified) {
        logger.warn("Login blocked - email not verified", {
          userId: authData.user.id,
          email: authData.user.email,
        });
        throw new AppError(
          403,
          "Please verify your email before logging in. Check your inbox for the verification code.",
          "EMAIL_NOT_VERIFIED",
          {
            userId: authData.user.id,
            email: authData.user.email,
          },
        );
      }

      logger.info("User logged in successfully", {
        userId: authData.user.id,
        username: profile.username,
      });

      return formatAuthResponse(
        authData.user,
        authData.session,
        profile.username,
        profile.display_name ?? undefined,
        profile.avatar_url ?? undefined,
        profile.bio ?? undefined,
        profile.created_at ?? undefined,
        profile.updated_at ?? undefined,
      );
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("Unexpected error during login", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new AppError(500, "Login failed", "LOGIN_ERROR");
    }
  }

  /**
   * Verify JWT token and return user
   */
  async verifyToken(token: string): Promise<SupabaseUser> {
    return this.sessionService.verifyToken(token);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return this.sessionService.refreshToken(refreshToken);
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    return getUserProfile(userId);
  }

  /**
   * Login with Google OAuth
   * @param idToken - Google ID token from mobile app
   * @returns AuthResponse with user and session
   */
  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    try {
      logger.info("Google OAuth login attempt");

      // 1. Verify Google ID token
      const googlePayload = await OAuthService.verifyGoogleToken(idToken);

      // 2. Create or retrieve OAuth user (includes session generation)
      const { userProfile, session } = await UserService.createOAuthUser(
        "google",
        googlePayload.sub,
        googlePayload.email,
        {
          name: googlePayload.name || googlePayload.email.split("@")[0],
          picture: googlePayload.picture,
        },
      );

      logger.info("Google OAuth login successful", {
        userId: userProfile.id,
        username: userProfile.username,
      });

      // 3. Return formatted auth response
      return {
        user: {
          id: userProfile.id,
          email: googlePayload.email,
          username: userProfile.username,
          displayName: userProfile.displayName,
          avatarUrl: userProfile.avatarUrl,
          bio: userProfile.bio,
          createdAt: userProfile.createdAt,
          updatedAt: userProfile.updatedAt,
        },
        session: {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresIn: session.expires_in || 3600,
          expiresAt: session.expires_at || 0,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error("Unexpected error during Google OAuth login", { error });
      throw new AppError(500, "Google login failed", "GOOGLE_LOGIN_ERROR");
    }
  }

  /**
   * Get linked authentication providers for a user
   * @param userId - User ID
   * @returns List of linked providers
   */
  async getLinkedProviders(userId: string): Promise<LinkedProvidersResponse> {
    return ProviderService.getLinkedProviders(userId);
  }

  /**
   * Login with Facebook OAuth
   * @param accessToken - Facebook access token from mobile app
   * @returns AuthResponse with user and session
   */
  async loginWithFacebook(accessToken: string): Promise<AuthResponse> {
    try {
      logger.info("Facebook OAuth login attempt");

      // 1. Verify Facebook access token
      const facebookPayload =
        await OAuthService.verifyFacebookToken(accessToken);

      // 2. Create or retrieve OAuth user (includes session generation)
      // Email may be undefined if user denied email permission
      const { userProfile, session } = await UserService.createOAuthUser(
        "facebook",
        facebookPayload.id,
        facebookPayload.email, // May be undefined - synthetic email will be generated
        {
          name: facebookPayload.name,
          picture: facebookPayload.picture,
        },
      );

      logger.info("Facebook OAuth login successful", {
        userId: userProfile.id,
        username: userProfile.username,
        hasSyntheticEmail: !facebookPayload.email,
      });

      // 3. Return formatted auth response
      // Use real email if provided, otherwise use email from session (which might be synthetic)
      const responseEmail = facebookPayload.email || session.user.email || "";

      return {
        user: {
          id: userProfile.id,
          email: responseEmail,
          username: userProfile.username,
          displayName: userProfile.displayName,
          avatarUrl: userProfile.avatarUrl,
          bio: userProfile.bio,
          createdAt: userProfile.createdAt,
          updatedAt: userProfile.updatedAt,
        },
        session: {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresIn: session.expires_in || 3600,
          expiresAt: session.expires_at || 0,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error("Unexpected error during Facebook OAuth login", { error });
      throw new AppError(500, "Facebook login failed", "FACEBOOK_LOGIN_ERROR");
    }
  }

  /**
   * Unlink an OAuth provider from a user's account
   * @param userId - User ID
   * @param provider - Provider to unlink ('google' or 'facebook')
   */
  async unlinkProvider(userId: string, provider: OAuthProvider): Promise<void> {
    return ProviderService.unlinkProvider(userId, provider);
  }
}
