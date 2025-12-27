import Redis from "ioredis";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

/**
 * Redis client configuration
 * Used for rate limiting and brute force protection
 */
const redisConfig = {
  host: env.REDIS_HOST || "redis",
  port: parseInt(env.REDIS_PORT || "6379"),
  password: env.REDIS_PASSWORD || undefined,
  db: parseInt(env.REDIS_DB || "0"),
  maxRetriesPerRequest: 3,
  enableOfflineQueue: true,
  lazyConnect: true,
  retryStrategy(times: number) {
    // Exponential backoff: 50ms, 100ms, 200ms, 400ms, 800ms, max 2s
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis connection attempt ${times}, retrying in ${delay}ms`);
    return delay;
  },
};

// Create Redis client instance
export const redisClient = new Redis(redisConfig);

// Track connection status
let isConnected = false;
let isConnecting = false;

// Connection event handlers
redisClient.on("connect", () => {
  isConnecting = true;
  logger.info("Redis connecting...");
});

redisClient.on("ready", () => {
  isConnected = true;
  isConnecting = false;
  logger.info("Redis connection established", {
    host: redisConfig.host,
    port: redisConfig.port,
    db: redisConfig.db,
  });
});

redisClient.on("error", (error) => {
  logger.error("Redis connection error", {
    error: error.message,
    host: redisConfig.host,
    port: redisConfig.port,
  });
});

redisClient.on("close", () => {
  isConnected = false;
  logger.warn("Redis connection closed");
});

redisClient.on("reconnecting", (delay: number) => {
  logger.info(`Redis reconnecting in ${delay}ms`);
});

/**
 * Initialize Redis connection
 * Call this at application startup
 */
export async function connectRedis(): Promise<void> {
  try {
    if (isConnected || isConnecting) {
      logger.info("Redis already connected or connecting");
      return;
    }

    await redisClient.connect();
    logger.info("Redis initialization successful");
  } catch (error) {
    logger.error("Failed to connect to Redis", {
      error: error instanceof Error ? error.message : "Unknown error",
      fallback: "Rate limiting will use in-memory store",
    });
    // Don't throw - allow graceful degradation to in-memory store
  }
}

/**
 * Gracefully disconnect Redis
 * Call this at application shutdown
 */
export async function disconnectRedis(): Promise<void> {
  try {
    if (!isConnected) {
      return;
    }

    await redisClient.quit();
    logger.info("Redis disconnected gracefully");
  } catch (error) {
    logger.error("Error disconnecting Redis", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Check if Redis is connected and ready
 */
export function isRedisConnected(): boolean {
  return isConnected && redisClient.status === "ready";
}

/**
 * Health check for Redis
 * Returns true if Redis is reachable
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    if (!isConnected) {
      return false;
    }

    const pong = await redisClient.ping();
    return pong === "PONG";
  } catch (error) {
    logger.error("Redis health check failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}
