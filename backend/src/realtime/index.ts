import { Server as SocketIOServer, Socket } from "socket.io";
import type { Server as HTTPServer } from "http";
import { logger } from "@/shared/utils/logger.js";

/**
 * Realtime Service
 * Manages Socket.io connections and event broadcasting
 *
 * Architecture:
 * - Singleton pattern for global access
 * - Room-based broadcasting for scalability
 * - Handler methods for each feature (playlist, player, etc.)
 */
class RealtimeService {
  private io: SocketIOServer | null = null;

  /**
   * Initialize Socket.io server
   */
  initialize(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", (socket) => {
      logger.info(`[Socket] Connected: ${socket.id}`);

      // Register all feature handlers
      this.registerPlaylistHandlers(socket);

      socket.on("disconnect", () => {
        logger.debug(`[Socket] Disconnected: ${socket.id}`);
      });
    });

    logger.info("[Socket] Realtime service initialized");
  }

  /**
   * Playlist event handlers
   */
  private registerPlaylistHandlers(socket: Socket) {
    socket.on("playlist:join", (playlistId: string) => {
      socket.join(`playlist:${playlistId}`);
      logger.debug(`[Socket] ${socket.id} joined playlist:${playlistId}`);
    });

    socket.on("playlist:leave", (playlistId: string) => {
      socket.leave(`playlist:${playlistId}`);
      logger.debug(`[Socket] ${socket.id} left playlist:${playlistId}`);
    });
  }

  /**
   * Notify all clients watching a playlist that it was updated
   */
  notifyPlaylistUpdate(
    playlistId: string,
    event: "track_added" | "track_removed" | "reordered",
    data?: Record<string, unknown>
  ) {
    if (!this.io) {
      logger.warn("[Socket] Cannot emit - Socket.io not initialized");
      return;
    }

    this.io
      .to(`playlist:${playlistId}`)
      .emit("playlist:updated", { playlistId, event, ...data });

    logger.debug(
      `[Socket] Emitted playlist:updated (${event}) to playlist:${playlistId}`
    );
  }

  /**
   * Get the Socket.io server instance (for advanced use cases)
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const realtime = new RealtimeService();
