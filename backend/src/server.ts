import express from "express";
import cors from "cors";
import { createServer } from "http";
import swaggerUi from "swagger-ui-express";
import { env } from "@/shared/config/env.js";
import { logger } from "@/shared/utils/logger.js";
import { errorHandler } from "@/shared/middleware/error-handler.js";
import { actionLoggerMiddleware } from "@/shared/middleware/action-logger.middleware.js";
import { routes } from "@/shared/config/routes.js";
import { realtime } from "@/realtime/index.js";
import { connectRedis, disconnectRedis, checkRedisHealth } from "@/shared/config/redis.js";
import { swaggerSpec, swaggerUiOptions } from "@/shared/config/swagger.config.js";

// Initialize Express app
const app = express();

// Create HTTP server
const httpServer = createServer(app);

realtime.initialize(httpServer);

// Initialize Redis connection
connectRedis().catch((error) => {
  logger.error("Failed to initialize Redis", {
    error: error instanceof Error ? error.message : "Unknown error",
  });
});

// =====================================================
// Middleware
// =====================================================

// CORS configuration
const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((origin) =>
  origin.trim(),
);

// Add tunnel URL to allowed origins if present (tunnel mode)
if (env.TUNNEL_URL) {
  allowedOrigins.push(env.TUNNEL_URL);
  // Also allow exp:// protocol version for Expo
  const expUrl = env.TUNNEL_URL.replace("https://", "exp://");
  allowedOrigins.push(expUrl);
  logger.info(`🌐 Tunnel CORS enabled: ${env.TUNNEL_URL}`);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // In development, auto-allow ngrok domains for tunnel mode
      if (env.NODE_ENV === "development" && origin.includes("ngrok")) {
        return callback(null, true);
      }

      // In development, auto-allow exp:// URLs for Expo
      if (env.NODE_ENV === "development" && origin.startsWith("exp://")) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Action logging middleware (extracts platform/device/version + logs all requests)
app.use(actionLoggerMiddleware);

// =====================================================
// Swagger API Documentation
// =====================================================

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// =====================================================
// Health Check
// =====================================================

app.get("/health", async (req, res) => {
  const redisHealthy = await checkRedisHealth();

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    services: {
      redis: redisHealthy ? "connected" : "disconnected",
    },
  });
});

// =====================================================
// API Routes (registered from central registry)
// =====================================================

routes.forEach(({ path, router }) => {
  app.use(path, router);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: "Route not found",
      code: "NOT_FOUND",
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

// =====================================================
// Error Handler
// =====================================================

app.use(errorHandler);

// =====================================================
// Start Server
// =====================================================

const PORT = env.PORT;
const HOST = "0.0.0.0"; // Listen on all network interfaces (allows LAN connections)

httpServer.listen(PORT, HOST, () => {
  logger.info("Music Room backend is running", {
    server: `http://localhost:${PORT}`,
    health: `http://localhost:${PORT}/health`,
    docs: `http://localhost:${PORT}/api-docs`,
    environment: env.NODE_ENV,
    host: HOST,
  });
  logger.info("API endpoints available", {
    auth: `http://localhost:${PORT}/api/auth`,
    profile: `http://localhost:${PORT}/api/profile`,
    playlists: `http://localhost:${PORT}/api/playlists`,
    soundcloud: `http://localhost:${PORT}/api/soundcloud`,
  });
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  await disconnectRedis();
  httpServer.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully...");
  await disconnectRedis();
  httpServer.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

export { app, httpServer };
