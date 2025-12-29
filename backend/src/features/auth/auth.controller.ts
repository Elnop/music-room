import type { Request, Response, NextFunction } from "express";
import { AuthService } from "@/features/auth/auth.service.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  googleLoginSchema,
  facebookLoginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from "@/features/auth/auth.validators.js";
import { EmailVerificationService } from "@/features/auth/services/email-verification.service.js";
import { supabase } from "@/shared/config/supabase.js";
import type { ApiResponse } from "@/shared/types/global.types.js";
import type { AuthenticatedRequest } from "@/shared/types/global.types.js";
import { logger } from "@/shared/utils/logger.js";
import { bruteForceService } from "@/features/auth/services/brute-force.service.js";
import { AppError } from "@/shared/middleware/error-handler.js";

const authService = new AuthService();

export class AuthController {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      logger.debug("Register request received", {
        body: req.body,
        headers: {
          "content-type": req.headers["content-type"],
          "user-agent": req.headers["user-agent"],
        },
      });

      const validated = registerSchema.parse(req.body);
      logger.debug("Validation passed", {
        email: validated.email,
        username: validated.username,
      });

      const result = await authService.register(validated);
      logger.debug("Registration successful", { userId: result.user.id });

      const response: ApiResponse = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error("Register error", { error });
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Login user with email and password
   */
  async login(req: Request, res: Response, next: NextFunction) {
    const body = req.body as { email?: string; password?: string };
    const email = body?.email || "unknown";
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    try {
      logger.info("Login request received", {
        email: body?.email,
        hasPassword: !!body?.password,
        contentType: req.headers["content-type"],
        origin: req.headers["origin"],
        ip,
      });

      const validated = loginSchema.parse(req.body);
      logger.info("Login validation passed", { email: validated.email });

      const result = await authService.login(validated);

      // SUCCESS: Reset failed attempts counter
      await bruteForceService.resetFailedAttempts(email, ip);

      logger.info("Login successful", {
        userId: result.user.id,
        email: result.user.email,
        hasAccessToken: !!result.session?.accessToken,
        ip,
      });

      const response: ApiResponse = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      res.json(response);
    } catch (error) {
      // FAILURE: Record failed attempt and IP activity
      const lockStatus = await bruteForceService.recordFailedAttempt(
        email,
        ip,
      );
      await bruteForceService.recordIPActivity(ip);

      logger.warn("Login failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        email,
        ip,
        failedAttempts: lockStatus.failedAttempts,
        remainingAttempts: lockStatus.remainingAttempts,
      });

      // Add lockout warning to error if approaching threshold
      if (!lockStatus.isLocked && lockStatus.failedAttempts >= 3) {
        // Check if error has a response property (like AppError)
        if (error && typeof error === "object") {
          (error as Record<string, unknown>).remainingAttempts = lockStatus.remainingAttempts;
          (error as Record<string, unknown>).lockoutWarning = `Account will be locked after ${lockStatus.remainingAttempts} more failed attempts`;
        }
      }

      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Get current authenticated user profile
   */
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const profile = await authService.getUserProfile(authReq.user.id);

      const response: ApiResponse = {
        success: true,
        data: { user: profile },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Logout current user (client-side token removal)
   */
  logout(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info("User logout", {
        userId: (req as AuthenticatedRequest).user.id,
      });

      const response: ApiResponse = {
        success: true,
        data: { message: "Logged out successfully" },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info("Token refresh request received");

      const validated = refreshTokenSchema.parse(req.body);
      const result = await authService.refreshToken(validated.refreshToken);

      logger.info("Token refresh successful", { userId: result.user.id });

      const response: ApiResponse = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      res.json(response);
    } catch (error) {
      logger.error("Token refresh error", { error });
      next(error);
    }
  }

  /**
   * POST /api/auth/google
   * Login with Google OAuth
   */
  async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info("Google OAuth login request received");

      const validated = googleLoginSchema.parse(req.body);
      const result = await authService.loginWithGoogle(validated.idToken);

      const response: ApiResponse = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error("Google login error", { error });
      next(error);
    }
  }

  /**
   * POST /api/auth/facebook
   * Login with Facebook OAuth
   */
  async facebookLogin(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info("Facebook OAuth login request received");

      const validated = facebookLoginSchema.parse(req.body);
      const result = await authService.loginWithFacebook(validated.accessToken);

      const response: ApiResponse = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error("Facebook login error", { error });
      next(error);
    }
  }

  /**
   * GET /api/auth/providers
   * Get list of linked authentication providers for current user
   */
  async getLinkedProviders(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      logger.info("Get linked providers request", { userId: authReq.user.id });

      const providers = await authService.getLinkedProviders(authReq.user.id);

      const response: ApiResponse = {
        success: true,
        data: providers,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      res.json(response);
    } catch (error) {
      logger.error("Get linked providers error", { error });
      next(error);
    }
  }

  /**
   * DELETE /api/auth/providers/:provider
   * Unlink an OAuth provider from the current user's account
   */
  async unlinkProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const provider = req.params.provider as "google" | "facebook";

      logger.info("Unlink provider request", {
        userId: authReq.user.id,
        provider,
      });

      // Validate provider
      if (!["google", "facebook"].includes(provider)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "INVALID_PROVIDER",
            message: "Invalid provider. Must be 'google' or 'facebook'",
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
        return res.status(400).json(response);
      }

      await authService.unlinkProvider(authReq.user.id, provider);

      const response: ApiResponse = {
        success: true,
        data: { message: `${provider} unlinked successfully` },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      res.json(response);
    } catch (error) {
      logger.error("Unlink provider error", { error });
      next(error);
    }
  }

  /**
   * POST /api/auth/verify-email
   * Verify email with 6-digit code
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = verifyEmailSchema.parse(req.body);
      const ip = req.ip || req.socket.remoteAddress || "unknown";

      logger.info("Email verification attempt", {
        userId: validated.userId,
        ip,
      });

      const verificationService = new EmailVerificationService();
      await verificationService.verifyCode(
        validated.userId,
        validated.code,
        ip,
      );

      // Fetch user email for session creation
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*, id")
        .eq("id", validated.userId)
        .single();

      if (profileError || !profile) {
        throw new AppError(404, "User not found", "USER_NOT_FOUND");
      }

      // Get user from Supabase Auth
      const { data: authUser, error: authError } =
        await supabase.auth.admin.getUserById(validated.userId);

      if (authError || !authUser.user) {
        throw new AppError(404, "Auth user not found", "AUTH_USER_NOT_FOUND");
      }

      // Generate session using Admin Magic Link API
      const { data: linkData, error: linkError } =
        await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: authUser.user.email!,
        });

      if (linkError || !linkData) {
        throw new AppError(
          500,
          "Failed to generate session",
          "SESSION_GENERATION_FAILED",
        );
      }

      const { hashed_token } = linkData.properties;
      if (!hashed_token) {
        throw new AppError(
          500,
          "Invalid session response",
          "INVALID_SESSION_RESPONSE",
        );
      }

      // Verify the token hash to obtain session
      const { data: verifyData, error: verifyError } =
        await supabase.auth.verifyOtp({
          token_hash: hashed_token,
          type: "email",
        });

      if (verifyError || !verifyData.session) {
        throw new AppError(
          500,
          "Failed to create session",
          "SESSION_CREATION_FAILED",
        );
      }

      logger.info("Email verified successfully", { userId: validated.userId });

      const response: ApiResponse = {
        success: true,
        data: {
          user: {
            id: profile.id,
            email: authUser.user.email!,
            username: profile.username,
            displayName: profile.display_name ?? undefined,
            avatarUrl: profile.avatar_url ?? undefined,
            bio: profile.bio ?? undefined,
            createdAt: profile.created_at ?? new Date().toISOString(),
            updatedAt: profile.updated_at ?? new Date().toISOString(),
          },
          session: {
            accessToken: verifyData.session.access_token,
            refreshToken: verifyData.session.refresh_token,
            expiresIn: verifyData.session.expires_in || 3600,
            expiresAt: verifyData.session.expires_at || 0,
          },
          message: "Email verified successfully",
        },
        meta: { timestamp: new Date().toISOString() },
      };

      res.json(response);
    } catch (error) {
      logger.error("Email verification error", { error });
      next(error);
    }
  }

  /**
   * POST /api/auth/resend-verification
   * Resend verification code
   */
  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = resendVerificationSchema.parse(req.body);
      const ip = req.ip || req.socket.remoteAddress || "unknown";

      logger.info("Resend verification request", {
        userId: validated.userId,
        email: validated.email,
        ip,
      });

      const verificationService = new EmailVerificationService();

      // Check rate limiting
      const { canResend, remainingSeconds } =
        await verificationService.canResendCode(validated.userId, ip);

      if (!canResend) {
        throw new AppError(
          429,
          `Please wait ${remainingSeconds} seconds before requesting a new code`,
          "RESEND_COOLDOWN",
        );
      }

      // Generate new code
      const code = await verificationService.generateAndStore(validated.userId);

      // Send email
      await verificationService.sendVerificationEmail(validated.email, code);

      // Record resend attempt
      await verificationService.recordResendAttempt(validated.userId, ip);

      logger.info("Verification code resent", {
        userId: validated.userId,
        email: validated.email,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          message: "Verification code sent. Please check your email.",
        },
        meta: { timestamp: new Date().toISOString() },
      };

      res.json(response);
    } catch (error) {
      logger.error("Resend verification error", { error });
      next(error);
    }
  }
}
