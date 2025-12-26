import type { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  facebookLoginSchema,
} from "./auth.validators.js";
import type { ApiResponse } from "@/shared/types/global.types.js";
import type { AuthenticatedRequest } from "@/shared/types/global.types.js";
import { logger } from "@/shared/utils/logger.js";

const authService = new AuthService();

export class AuthController {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      logger.debug("🔵 Register request received", {
        body: req.body,
        headers: {
          "content-type": req.headers["content-type"],
          "user-agent": req.headers["user-agent"],
        },
      });

      const validated = registerSchema.parse(req.body);
      logger.debug("🔵 Validation passed", {
        email: validated.email,
        username: validated.username,
      });

      const result = await authService.register(validated);
      logger.debug("🔵 Registration successful", { userId: result.user.id });

      const response: ApiResponse = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error("🔴 Register error", { error });
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Login user with email and password
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as { email?: string; password?: string };
      logger.info("🔵 Login request received", {
        email: body?.email,
        hasPassword: !!body?.password,
        contentType: req.headers["content-type"],
        origin: req.headers["origin"],
      });

      const validated = loginSchema.parse(req.body);
      logger.info("🔵 Login validation passed", { email: validated.email });

      const result = await authService.login(validated);
      logger.info("🔵 Login successful", {
        userId: result.user.id,
        email: result.user.email,
        hasAccessToken: !!result.session.accessToken,
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
      const body = req.body as { email?: string };
      logger.error("🔴 Login error", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        email: body?.email,
      });
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
}
