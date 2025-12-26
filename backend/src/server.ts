import express from "express";
import cors from "cors";
import { createServer } from "http";
import { env } from "./shared/config/env.js";
import { logger } from "./shared/utils/logger.js";
import { errorHandler } from "./shared/middleware/error-handler.js";
import { routes } from "./shared/config/routes.js";
import { realtime } from "./realtime/index.js";

// Initialize Express app
const app = express();

// Create HTTP server
const httpServer = createServer(app);

realtime.initialize(httpServer);

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
        logger.debug(`✓ CORS allowed (ngrok tunnel): ${origin}`);
        return callback(null, true);
      }

      // In development, auto-allow exp:// URLs for Expo
      if (env.NODE_ENV === "development" && origin.startsWith("exp://")) {
        logger.debug(`✓ CORS allowed (Expo): ${origin}`);
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        logger.warn(`❌ CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const logData: {
    ip: string | undefined;
    userAgent: string | undefined;
    origin: string | undefined;
  } = {
    ip: req.ip,
    userAgent: req.get("user-agent"),
    origin: req.get("origin"),
  };

  // Log body for POST/PUT/PATCH requests (hide passwords)
  if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
    const body = { ...req.body };
    if (body.password) body.password = "***";
    logData.body = body;
  }

  logger.info(`📨 ${req.method} ${req.path}`, logData);
  next();
});

// =====================================================
// Health Check
// =====================================================

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
  });
});

// =====================================================
// API Routes (registered from central registry)
// =====================================================

routes.forEach(({ path, router, description }) => {
  app.use(path, router);
  logger.debug(
    `✓ Registered route: ${path}${description ? ` - ${description}` : ""}`,
  );
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

httpServer.listen(PORT, () => {
  logger.info(`🚀 Music Room backend is running!`);
  logger.info(`📍 Server: http://localhost:${PORT}`);
  logger.info(`🏥 Health: http://localhost:${PORT}/health`);
  logger.info(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  logger.info(`👤 Profile API: http://localhost:${PORT}/api/profile`);
  logger.info(`📝 Playlist API: http://localhost:${PORT}/api/playlists`);
  logger.info(`🎵 SoundCloud API: http://localhost:${PORT}/api/soundcloud`);
  logger.info(`🌍 Environment: ${env.NODE_ENV}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  httpServer.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully...");
  httpServer.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

export { app, httpServer };
