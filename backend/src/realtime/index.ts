import { Server as SocketIOServer, Socket } from "socket.io";
import type { Server as HTTPServer } from "http";
import { logger } from "@/shared/utils/logger.js";
import type { TrackWithPositionResponse } from "@/features/playlists/playlist.types.js";
import { musicControlService } from "@/features/music-control/music-control.service.js";
import type {
  DeviceInfo,
  ListeningStatus,
  UserListeningStatus,
  ControlActionPayload,
} from "@/features/music-control/music-control.types.js";

// Typed payloads for playlist events
export interface TrackAddedPayload {
  track: TrackWithPositionResponse;
}

export interface TrackRemovedPayload {
  trackId: string;
}

export type PlaylistEventPayload =
  | TrackAddedPayload
  | TrackRemovedPayload
  | undefined;

/**
 * Auth registration payload with device info
 */
interface AuthRegisterPayload {
  userId: string;
  device: DeviceInfo;
}

/**
 * Listening update payload from client
 */
interface ListeningUpdatePayload {
  device: DeviceInfo;
  track: {
    id: number;
    title: string;
    artist: string;
    artworkUrl: string | null;
  } | null;
  isPlaying: boolean;
}

/**
 * Validate listening update payload structure
 */
function isValidListeningUpdatePayload(
  data: unknown
): data is ListeningUpdatePayload {
  if (!data || typeof data !== "object") return false;
  const payload = data as Record<string, unknown>;

  // Validate device
  if (!payload.device || typeof payload.device !== "object") return false;
  const device = payload.device as Record<string, unknown>;
  if (typeof device.deviceId !== "string" || !device.deviceId) return false;
  if (typeof device.deviceName !== "string") return false;

  // Validate isPlaying
  if (typeof payload.isPlaying !== "boolean") return false;

  // Validate track (can be null)
  if (payload.track !== null) {
    if (typeof payload.track !== "object") return false;
    const track = payload.track as Record<string, unknown>;
    if (typeof track.title !== "string") return false;
    if (typeof track.artist !== "string") return false;
  }

  return true;
}

/**
 * Realtime Service
 * Manages Socket.io connections and event broadcasting
 *
 * Architecture:
 * - Singleton pattern for global access
 * - Room-based broadcasting for scalability
 * - Multi-device support: each user can have multiple devices connected
 * - Handler methods for each feature (playlist, player, etc.)
 */
class RealtimeService {
  private io: SocketIOServer | null = null;

  private listeningStatuses: Map<string, Map<string, ListeningStatus>> =
    new Map();

  private socketToDevice: Map<string, { userId: string; deviceId: string }> =
    new Map();

  private deviceToSocket: Map<string, string> = new Map();

  // Throttle listening updates per device
  private lastListeningUpdate: Map<string, number> = new Map();
  private static LISTENING_UPDATE_THROTTLE_MS = 1000; // 1 second

  /**
   * Initialize Socket.io server
   */
  initialize(httpServer: HTTPServer) {
    const corsOrigin = process.env.SOCKET_IO_CORS_ORIGIN || "*";

    logger.info(`[Socket] Initializing with CORS origin: ${corsOrigin}`);

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: corsOrigin,
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.io.on("connection", (socket) => {
      const transport = socket.conn.transport.name;
      logger.info(
        `[Socket] ✅ Client connected: ${socket.id} via ${transport}`
      );

      // Log transport upgrades
      socket.conn.on("upgrade", (newTransport: { name: string }) => {
        logger.debug(
          `[Socket] Transport upgraded: ${socket.id} from ${transport} to ${newTransport.name}`
        );
      });

      this.registerAuthHandlers(socket);
      this.registerPlaylistHandlers(socket);
      this.registerMusicControlHandlers(socket);

      socket.on("disconnect", (reason) => {
        this.handleDisconnect(socket);
        logger.info(
          `[Socket] ❌ Client disconnected: ${socket.id} - ${reason}`
        );
      });

      socket.on("error", (error) => {
        logger.error(`[Socket] Error on ${socket.id}:`, error);
      });
    });

    logger.info("[Socket] Realtime service initialized");
  }

  /**
   * Authentication handlers - associate socket with user and device
   */
  private registerAuthHandlers(socket: Socket) {
    socket.on("auth:register", (data: AuthRegisterPayload) => {
      const { userId, device } = data;
      const deviceKey = `${userId}:${device.deviceId}`;

      // Store mappings
      this.socketToDevice.set(socket.id, { userId, deviceId: device.deviceId });
      this.deviceToSocket.set(deviceKey, socket.id);

      // Join personal room for targeted messages
      socket.join(`user:${userId}`);

      logger.debug(
        `[Socket] User ${userId} registered device "${device.deviceName}" (${device.deviceId}) with socket ${socket.id}`
      );
    });
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
   * Music control handlers - multi-device support
   */
  private registerMusicControlHandlers(socket: Socket) {
    socket.on("listening:update", async (data: unknown) => {
      // Validate payload structure
      if (!isValidListeningUpdatePayload(data)) {
        logger.warn("[Socket] listening:update received invalid payload");
        return;
      }

      const socketInfo = this.socketToDevice.get(socket.id);
      if (!socketInfo) {
        logger.warn("[Socket] listening:update from unauthenticated socket");
        return;
      }

      const { userId, deviceId } = socketInfo;
      const throttleKey = `${userId}:${deviceId}`;

      const now = Date.now();
      const lastUpdate = this.lastListeningUpdate.get(throttleKey) || 0;
      if (now - lastUpdate < RealtimeService.LISTENING_UPDATE_THROTTLE_MS) {
        return;
      }
      this.lastListeningUpdate.set(throttleKey, now);

      let userDevices = this.listeningStatuses.get(userId);
      if (!userDevices) {
        userDevices = new Map();
        this.listeningStatuses.set(userId, userDevices);
      }

      const status: ListeningStatus = {
        ownerId: userId,
        device: data.device,
        track: data.track,
        isPlaying: data.isPlaying,
        updatedAt: new Date().toISOString(),
      };
      userDevices.set(deviceId, status);

      logger.debug(
        `[Socket] User ${userId} device "${data.device.deviceName}" updated status`,
        {
          track: status.track?.title,
          isPlaying: status.isPlaying,
        }
      );

      try {
        await this.broadcastUserListeningStatus(userId);
      } catch (error) {
        logger.error(
          `[Socket] Failed to broadcast listening status for user ${userId}`,
          { error }
        );
      }
    });

    // User subscribes to another user's listening status (all devices)
    socket.on("listening:subscribe", async (targetUserId: string) => {
      const socketInfo = this.socketToDevice.get(socket.id);
      if (!socketInfo) {
        logger.warn("[Socket] listening:subscribe from unauthenticated socket");
        return;
      }

      const { userId: myUserId } = socketInfo;

      const canControl = await musicControlService.canControl(
        myUserId,
        targetUserId
      );
      if (!canControl) {
        socket.emit("listening:error", {
          message: "Not authorized to view this user's listening status",
          code: "NOT_AUTHORIZED",
        });
        return;
      }

      socket.join(`listening:${targetUserId}`);

      const userDevices = this.listeningStatuses.get(targetUserId);
      const devices = userDevices ? Array.from(userDevices.values()) : [];

      const userStatus: UserListeningStatus = {
        ownerId: targetUserId,
        devices,
      };
      socket.emit("listening:status", userStatus);

      logger.debug(
        `[Socket] User ${myUserId} subscribed to ${targetUserId} (${devices.length} devices online)`
      );
    });

    socket.on("listening:unsubscribe", (targetUserId: string) => {
      socket.leave(`listening:${targetUserId}`);
      logger.debug(
        `[Socket] ${socket.id} unsubscribed from listening:${targetUserId}`
      );
    });

    socket.on("control:action", async (data: ControlActionPayload) => {
      const socketInfo = this.socketToDevice.get(socket.id);
      if (!socketInfo) {
        logger.warn("[Socket] control:action from unauthenticated socket");
        return;
      }

      const { userId: controllerId } = socketInfo;

      const canControl = await musicControlService.canControl(
        controllerId,
        data.targetUserId
      );
      if (!canControl) {
        socket.emit("control:error", {
          message: "Not authorized to control this user's music",
          code: "NOT_AUTHORIZED",
        });
        return;
      }

      const targetDeviceKey = `${data.targetUserId}:${data.targetDeviceId}`;
      const targetSocketId = this.deviceToSocket.get(targetDeviceKey);

      if (targetSocketId && this.io) {
        // Send command only to the specific device
        this.io.to(targetSocketId).emit("control:command", {
          action: data.action,
          fromUserId: controllerId,
        });

        logger.info(
          `[Socket] Control action ${data.action} sent from ${controllerId} to device ${data.targetDeviceId} of user ${data.targetUserId}`
        );

        socket.emit("control:success", {
          action: data.action,
          targetUserId: data.targetUserId,
          targetDeviceId: data.targetDeviceId,
        });
      } else {
        socket.emit("control:error", {
          message: "Target device is not online",
          code: "DEVICE_OFFLINE",
        });
      }
    });
  }

  /**
   * Broadcast all devices' listening status for a user
   */
  private async broadcastUserListeningStatus(userId: string) {
    if (!this.io) return;

    const room = `listening:${userId}`;
    const socketsInRoom = this.io.sockets.adapter.rooms.get(room);
    const subscriberCount = socketsInRoom ? socketsInRoom.size : 0;

    const userDevices = this.listeningStatuses.get(userId);
    const devices = userDevices ? Array.from(userDevices.values()) : [];

    const userStatus: UserListeningStatus = {
      ownerId: userId,
      devices,
    };

    logger.debug(
      `[Socket] Broadcasting ${devices.length} devices for user ${userId} to ${subscriberCount} subscribers`
    );

    // Emit to the listening room for this user
    this.io.to(room).emit("listening:status", userStatus);
  }

  /**
   * Handle socket disconnect - cleanup only the disconnected device
   */
  private handleDisconnect(socket: Socket) {
    const socketInfo = this.socketToDevice.get(socket.id);
    if (socketInfo) {
      const { userId, deviceId } = socketInfo;
      const deviceKey = `${userId}:${deviceId}`;

      const userDevices = this.listeningStatuses.get(userId);
      if (userDevices) {
        userDevices.delete(deviceId);
        if (userDevices.size === 0) {
          this.listeningStatuses.delete(userId);
        }
      }

      this.lastListeningUpdate.delete(deviceKey);

      this.broadcastUserListeningStatus(userId).catch((error) => {
        logger.error(
          `[Socket] Failed to broadcast listening status for user ${userId} on disconnect`,
          { error }
        );
      });

      // Cleanup maps
      this.socketToDevice.delete(socket.id);
      this.deviceToSocket.delete(deviceKey);

      logger.debug(
        `[Socket] Cleaned up device ${deviceId} for user ${userId} on disconnect`
      );
    }
  }

  /**
   * Notify all clients watching a playlist that it was updated
   */
  notifyPlaylistUpdate(
    playlistId: string,
    event: "track_added",
    data: TrackAddedPayload
  ): void;
  notifyPlaylistUpdate(
    playlistId: string,
    event: "track_removed",
    data: TrackRemovedPayload
  ): void;
  notifyPlaylistUpdate(playlistId: string, event: "reordered"): void;
  notifyPlaylistUpdate(
    playlistId: string,
    event: "track_added" | "track_removed" | "reordered",
    data?: PlaylistEventPayload
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

  /**
   * Notify a user that their music control permission has changed
   * Called when someone grants or revokes control to them
   */
  notifyPermissionChange(
    targetUserId: string,
    ownerId: string,
    granted: boolean
  ) {
    if (!this.io) return;

    this.io.to(`user:${targetUserId}`).emit("permission:changed", {
      ownerId,
      targetUserId,
      canControl: granted,
    });

    logger.debug(
      `[Socket] Permission ${granted ? "granted" : "revoked"}: ${ownerId} -> ${targetUserId}`
    );
  }

  /**
   * Get listening status for a user (all devices) - for testing/debugging
   */
  getUserListeningStatus(userId: string): UserListeningStatus {
    const userDevices = this.listeningStatuses.get(userId);
    const devices = userDevices ? Array.from(userDevices.values()) : [];
    return { ownerId: userId, devices };
  }
}

export const realtime = new RealtimeService();
