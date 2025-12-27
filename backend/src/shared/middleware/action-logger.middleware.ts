import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";
import type { AuthenticatedRequest } from "../types/global.types.js";

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

  // Log request start
  const userId = (req as AuthenticatedRequest).user?.id;
  logger.info("API Request", {
    action: `${req.method} ${req.path}`,
    userId: userId || "anonymous",
    platform,
    device,
    appVersion,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  // Capture response to log status code
  const originalSend = res.send;
  res.send = function (body): Response {
    const responseTime = Date.now() - startTime;

    // Log response
    logger.info("API Response", {
      action: `${req.method} ${req.path}`,
      userId: userId || "anonymous",
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
    });

    return originalSend.call(this, body);
  };

  next();
}
