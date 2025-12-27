import type { Request, Response, NextFunction } from "express";
import { logger } from "@/shared/utils/logger.js";
import type { AuthenticatedRequest } from "@/shared/types/global.types.js";

/**
 * Action logging middleware
 * Extracts client metadata (platform, device, version) from headers
 * and logs all API requests automatically
 */
export function actionLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startTime = Date.now();

  // Extract client metadata from custom headers
  const platform = req.get("X-Platform") || "Unknown Platform";
  const device = req.get("X-Device-Model") || "Unknown Device";
  const appVersion = req.get("X-App-Version") || "0.0.0";

  // Attach to request object for use in controllers
  (req as AuthenticatedRequest).actionLogContext = {
    platform,
    device,
    appVersion,
  };

  // Log request start (without userId - auth hasn't run yet)
  logger.info("HTTP Request", {
    method: req.method,
    path: req.originalUrl,
    platform,
    device,
    appVersion,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  // Listen for response finish to log after auth middleware runs
  res.on("finish", () => {
    const responseTime = Date.now() - startTime;
    // Get userId NOW (after auth middleware has attached it)
    const userId = (req as AuthenticatedRequest).user?.id;

    // Log response with actual userId
    logger.info("HTTP Response", {
      method: req.method,
      path: req.originalUrl,
      userId: userId || "anonymous",
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      platform,
      device,
      appVersion,
    });
  });

  next();
}
