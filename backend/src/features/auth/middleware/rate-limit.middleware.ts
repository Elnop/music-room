import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { Request, Response } from "express";
import { redisClient, isRedisConnected } from "@/shared/config/redis.js";
import { rateLimitConfig } from "@/shared/config/rate-limit.config.js";
import { logger } from "@/shared/utils/logger.js";

// Helper function to get IP address (handles both IPv4 and IPv6)
const getClientIp = (req: Request): string => {
  // Express sets req.ip based on trust proxy settings
  // This properly handles X-Forwarded-For headers
  return req.ip || req.socket.remoteAddress || "unknown";
};

/**
 * Base rate limiter configuration
 * Used as foundation for endpoint-specific limiters
 */
const baseRateLimitConfig = {
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    logger.warn("Rate limit exceeded", {
      endpoint: req.path,
      ip: req.ip,
      email: req.body.email,
      userAgent: req.get("user-agent"),
    });

    res.status(429).json({
      success: false,
      error: {
        message: "Too many requests. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: new Date(
          Date.now() + (req.rateLimit?.resetTime?.getTime() || 0) - Date.now(),
        ).toISOString(),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for whitelisted IPs
    if (rateLimitConfig.whitelist.length > 0) {
      const clientIp = req.ip || "";
      return rateLimitConfig.whitelist.includes(clientIp);
    }
    return false;
  },
};

/**
 * Get Redis store for rate limiting
 * Falls back to in-memory store if Redis is unavailable
 */
function getStore(prefix: string): RedisStore | undefined {
  if (!rateLimitConfig.enabled) {
    logger.info("Rate limiting is disabled via configuration");
    return undefined;
  }

  if (isRedisConnected()) {
    logger.debug(`Using Redis store for rate limiting: ${prefix}`);
    return new RedisStore({
      // @ts-expect-error - RedisStore types don't match ioredis perfectly but it works
      sendCommand: (...args: string[]) => redisClient.call(...args),
      prefix: `rl:${prefix}:`,
    });
  }

  if (rateLimitConfig.fallbackToMemory) {
    logger.warn(
      `Redis unavailable, using in-memory store for rate limiting: ${prefix}`,
    );
    return undefined; // express-rate-limit uses in-memory store by default
  }

  logger.error("Rate limiting disabled: Redis unavailable and fallback disabled");
  return undefined;
}

/**
 * Login Rate Limiter
 * Most restrictive: 5 attempts per 15 minutes per email+IP combination
 */
export const loginRateLimiter = rateLimit({
  ...baseRateLimitConfig,
  windowMs: rateLimitConfig.login.windowMs,
  max: rateLimitConfig.login.max,
  keyGenerator: (req: Request) => {
    // Combine email + IP for granular tracking
    const email = req.body.email || "unknown";
    const ip = getClientIp(req);
    return `login:${email}:${ip}`;
  },
  skipSuccessfulRequests: true, // Only count failed login attempts
  store: getStore("auth:login"),
  handler: (req: Request, res: Response) => {
    logger.warn("Login rate limit exceeded", {
      ip: req.ip,
      email: req.body.email,
      userAgent: req.get("user-agent"),
      remainingAttempts: 0,
    });

    res.status(429).json({
      success: false,
      error: {
        message: "Too many login attempts. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: new Date(
          Date.now() + (req.rateLimit?.resetTime?.getTime() || 0) - Date.now(),
        ).toISOString(),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  },
});

/**
 * Register Rate Limiter
 * Strict: 3 registrations per hour per IP
 */
export const registerRateLimiter = rateLimit({
  ...baseRateLimitConfig,
  windowMs: rateLimitConfig.register.windowMs,
  max: rateLimitConfig.register.max,
  keyGenerator: (req: Request) => {
    return `register:${getClientIp(req)}`;
  },
  store: getStore("auth:register"),
  handler: (req: Request, res: Response) => {
    logger.warn("Registration rate limit exceeded", {
      ip: req.ip,
      email: req.body.email,
      userAgent: req.get("user-agent"),
    });

    res.status(429).json({
      success: false,
      error: {
        message:
          "Too many registration attempts. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: new Date(
          Date.now() + (req.rateLimit?.resetTime?.getTime() || 0) - Date.now(),
        ).toISOString(),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  },
});

/**
 * OAuth Rate Limiter
 * More lenient: 10 attempts per 15 minutes per provider+IP
 */
export const oauthRateLimiter = rateLimit({
  ...baseRateLimitConfig,
  windowMs: rateLimitConfig.oauth.windowMs,
  max: rateLimitConfig.oauth.max,
  keyGenerator: (req: Request) => {
    // Determine provider from path (google or facebook)
    const provider = req.path.includes("google") ? "google" : "facebook";
    return `oauth:${provider}:${getClientIp(req)}`;
  },
  store: getStore("auth:oauth"),
  handler: (req: Request, res: Response) => {
    const provider = req.path.includes("google") ? "Google" : "Facebook";

    logger.warn("OAuth rate limit exceeded", {
      provider,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(429).json({
      success: false,
      error: {
        message: `Too many ${provider} login attempts. Please try again later.`,
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: new Date(
          Date.now() + (req.rateLimit?.resetTime?.getTime() || 0) - Date.now(),
        ).toISOString(),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  },
});

/**
 * Global Auth Rate Limiter
 * Safety net: 20 requests per 15 minutes to all /api/auth/* endpoints per IP
 * Applied to all auth routes as the first middleware
 */
export const globalAuthRateLimiter = rateLimit({
  ...baseRateLimitConfig,
  windowMs: rateLimitConfig.global.windowMs,
  max: rateLimitConfig.global.max,
  keyGenerator: (req: Request) => {
    return `auth:global:${getClientIp(req)}`;
  },
  store: getStore("auth:global"),
  handler: (req: Request, res: Response) => {
    logger.warn("Global auth rate limit exceeded", {
      endpoint: req.path,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(429).json({
      success: false,
      error: {
        message:
          "Too many authentication requests. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: new Date(
          Date.now() + (req.rateLimit?.resetTime?.getTime() || 0) - Date.now(),
        ).toISOString(),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  },
});
