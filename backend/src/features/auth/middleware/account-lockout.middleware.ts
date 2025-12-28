import { Request, Response, NextFunction } from "express";
import { bruteForceService } from "@/features/auth/services/brute-force.service.js";
import { logger } from "@/shared/utils/logger.js";

/**
 * Account Lockout Middleware
 * Checks if an account is locked before allowing login attempts
 * Should be applied to the login endpoint AFTER rate limiting
 */
interface LockoutWarning {
  remainingAttempts: number;
  failedAttempts: number;
}

export async function checkAccountLockout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const body = req.body as { email?: string };
  const email = body.email;
  const ip = req.ip || req.socket.remoteAddress || "unknown";

  if (!email) {
    // Email is required - let validation handle this
    return next();
  }

  try {
    // Check if account is currently locked
    const lockStatus = await bruteForceService.checkLockout(email, ip);

    if (lockStatus.isLocked) {
      logger.warn("Login attempt on locked account", {
        email,
        ip,
        lockedUntil: lockStatus.lockedUntil?.toISOString(),
        failedAttempts: lockStatus.failedAttempts,
      });

      res.status(429).json({
        success: false,
        error: {
          message:
            "Account temporarily locked due to too many failed login attempts. Please try again later.",
          code: "ACCOUNT_LOCKED",
          lockedUntil: lockStatus.lockedUntil?.toISOString(),
          remainingTime: lockStatus.remainingSeconds,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Check if approaching lockout threshold (3+ failed attempts)
    if (lockStatus.failedAttempts >= 3) {
      // Attach warning to request for use in controller
      (req as Request & { lockoutWarning?: LockoutWarning }).lockoutWarning = {
        remainingAttempts: lockStatus.remainingAttempts ?? 0,
        failedAttempts: lockStatus.failedAttempts,
      };

      logger.info("User approaching lockout threshold", {
        email,
        ip,
        failedAttempts: lockStatus.failedAttempts,
        remainingAttempts: lockStatus.remainingAttempts,
      });
    }

    // Account not locked, proceed to login handler
    next();
  } catch (error) {
    logger.error("Error in account lockout middleware", {
      error: error instanceof Error ? error.message : "Unknown error",
      email,
      ip,
    });

    // On error, allow login attempt to proceed
    // The failure will be recorded in the controller
    next();
  }
}

/**
 * IP Blacklist Middleware
 * Checks if an IP is blacklisted before allowing any auth requests
 * Can be applied globally to all auth routes or specific endpoints
 */
export async function checkIPBlacklist(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || "unknown";

  try {
    const isBlacklisted = await bruteForceService.isIPBlacklisted(ip);

    if (isBlacklisted) {
      logger.error("Request from blacklisted IP", {
        ip,
        endpoint: req.path,
        userAgent: req.get("user-agent"),
      });

      res.status(403).json({
        success: false,
        error: {
          message:
            "Access temporarily restricted due to suspicious activity from this IP address.",
          code: "IP_BLOCKED",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  } catch (error) {
    logger.error("Error in IP blacklist middleware", {
      error: error instanceof Error ? error.message : "Unknown error",
      ip,
    });

    // On error, allow request to proceed
    next();
  }
}
