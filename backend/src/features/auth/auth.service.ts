import { supabase } from "@/shared/config/supabase.js";
import { AppError } from "@/shared/middleware/error-handler.js";
import { logger } from "@/shared/utils/logger.js";
import {
  formatAuthResponse,
  fetchUserProfile,
  getUserProfile,
} from "./utils/auth.helpers.js";
import { SessionService } from "./services/session.service.js";
import { OAuthService } from "./services/oauth.service.js";
import { UserService } from "./services/user.service.js";
import { ProviderService } from "./services/provider.service.js";
import type {
  RegisterDTO,
  LoginDTO,
  AuthResponse,
  UserProfile,
  SupabaseUser,
  LinkedProvidersResponse,
  OAuthProvider,
} from "./auth.types.js";

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

      // 1. Check if username already exists
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("username")
        .eq("username", data.username)
        .single();

      if (existingProfile) {
        throw new AppError(409, "Username already taken", "USERNAME_TAKEN");
      }

      // 2. Create user in Supabase Auth using Admin API
      // Using admin.createUser to bypass email confirmation in development
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true, // Auto-confirm email for development
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

      // Generate a session manually using signInWithPassword
      const { data: sessionData, error: sessionError } =
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

      if (sessionError || !sessionData.session) {
        logger.error("Failed to create session after user creation", {
          error: sessionError,
        });
        throw new AppError(
          500,
          "User created but failed to generate session",
          "SESSION_ERROR",
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

      logger.info("User registered successfully", { userId: authData.user.id });

      return formatAuthResponse(
        authData.user,
        sessionData.session,
        data.username,
        data.displayName,
      );
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

      // Fetch user profile
      const profile = await fetchUserProfile(authData.user.id);

      logger.info("User logged in successfully", {
        userId: authData.user.id,
        username: profile.username,
      });

      return formatAuthResponse(
        authData.user,
        authData.session,
        profile.username,
        profile.display_name,
        profile.avatar_url,
        profile.bio,
        profile.created_at,
        profile.updated_at,
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
          displayName: userProfile.display_name,
          avatarUrl: userProfile.avatar_url,
          bio: userProfile.bio,
          createdAt: userProfile.created_at,
          updatedAt: userProfile.updated_at,
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
          displayName: userProfile.display_name,
          avatarUrl: userProfile.avatar_url,
          bio: userProfile.bio,
          createdAt: userProfile.created_at,
          updatedAt: userProfile.updated_at,
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
