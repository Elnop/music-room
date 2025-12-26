import type { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import type { AuthenticatedRequest } from "@/shared/types/global.types.js";
import { logger } from "@/shared/utils/logger.js";

const authService = new AuthService();

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header and attaches user to request
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: {
          message: "No authorization header provided",
          code: "NO_AUTH_HEADER",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: {
          message:
            "Invalid authorization header format. Expected: Bearer <token>",
          code: "INVALID_AUTH_FORMAT",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: "No token provided",
          code: "NO_TOKEN",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Verify token with Supabase
    const user = await authService.verifyToken(token);

    // Attach user to request
    (req as AuthenticatedRequest).user = user;

    logger.debug("User authenticated", { userId: user.id });

    next();
  } catch (error: unknown) {
    const err = error as Error & { code?: string };
    logger.warn("Authentication failed", { error: err.message });
    return res.status(401).json({
      success: false,
      error: {
        message: err.message || "Authentication failed",
        code: err.code || "AUTH_FAILED",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * Optional authentication middleware
 * Similar to authMiddleware but doesn't fail if no token is provided
 * Useful for endpoints that work differently for authenticated/unauthenticated users
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return next();
    }

    const user = await authService.verifyToken(token);
    (req as AuthenticatedRequest).user = user;

    logger.debug("User optionally authenticated", { userId: user.id });

    next();
  } catch (error) {
    // Don't fail, just continue without user
    logger.debug("Optional auth failed, continuing without user");
    next();
  }
}
