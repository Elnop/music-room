import { Server as SocketIOServer, Socket } from "socket.io";
import type { Server as HTTPServer } from "http";
import { socketLogger } from "@/shared/middleware/socket-logger.middleware.js";
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
  data: unknown,
): data is ListeningUpdatePayload {
  if (!data || typeof data !== "object") return false;
  const payload = data as Record<string, unknown>;

  if (!payload.device || typeof payload.device !== "object") return false;
  const device = payload.device as Record<string, unknown>;
  if (typeof device.deviceId !== "string" || !device.deviceId) return false;
  if (typeof device.deviceName !== "string") return false;

  if (typeof payload.isPlaying !== "boolean") return false;

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

  private lastListeningUpdate: Map<string, number> = new Map();
  private static LISTENING_UPDATE_THROTTLE_MS = 1000;

  /**
   * Initialize Socket.io server
   */
  initialize(httpServer: HTTPServer) {
    const corsOrigin = process.env.SOCKET_IO_CORS_ORIGIN || "*";

    socketLogger.init("initializing", { corsOrigin });

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
      socketLogger.connection(socket.id, transport, { action: "connected" });

      socket.conn.on("upgrade", (newTransport: { name: string }) => {
        socketLogger.event("transport:upgraded", socket.id, {
          from: transport,
          to: newTransport.name,
          action: "upgraded",
        });
      });

      this.registerAuthHandlers(socket);
      this.registerPlaylistHandlers(socket);
      this.registerMusicControlHandlers(socket);

      socket.on("disconnect", (reason) => {
        this.handleDisconnect(socket);
        socketLogger.disconnect(socket.id, reason, { action: "disconnected" });
      });

      socket.on("error", (error) => {
        socketLogger.error(socket.id, error, { action: "error" });
      });
    });

    socketLogger.init("initialized", { action: "ready" });
  }

  /**
   * Authentication handlers - associate socket with user and device
   */
  private registerAuthHandlers(socket: Socket) {
    socket.on("auth:register", (data: AuthRegisterPayload) => {
      const { userId, device } = data;
      const deviceKey = `${userId}:${device.deviceId}`;

      this.socketToDevice.set(socket.id, { userId, deviceId: device.deviceId });
      this.deviceToSocket.set(deviceKey, socket.id);

      void socket.join(`user:${userId}`);

      socketLogger.auth("register", userId, socket.id, {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        action: "device_registered",
      });
    });
  }

  /**
   * Playlist event handlers
   */
  private registerPlaylistHandlers(socket: Socket) {
    socket.on("playlist:join", (playlistId: string) => {
      void socket.join(`playlist:${playlistId}`);
      socketLogger.event("playlist:join", socket.id, {
        playlistId,
        room: `playlist:${playlistId}`,
        action: "joined",
      });
    });

    socket.on("playlist:leave", (playlistId: string) => {
      void socket.leave(`playlist:${playlistId}`);
      socketLogger.event("playlist:leave", socket.id, {
        playlistId,
        room: `playlist:${playlistId}`,
        action: "left",
      });
    });
  }

  /**
   * Music control handlers - multi-device support
   */
  private registerMusicControlHandlers(socket: Socket) {
    socket.on("listening:update", (data: unknown) => {
      const startTime = Date.now();

      if (!isValidListeningUpdatePayload(data)) {
        socketLogger.event("listening:update", socket.id, {
          level: "warn",
          action: "invalid_payload",
        });
        return;
      }

      const socketInfo = this.socketToDevice.get(socket.id);
      if (!socketInfo) {
        socketLogger.event("listening:update", socket.id, {
          level: "warn",
          action: "unauthenticated",
        });
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

      const processingTime = Date.now() - startTime;
      socketLogger.event("listening:update", socket.id, {
        userId,
        deviceId,
        deviceName: data.device.deviceName,
        track: status.track?.title,
        isPlaying: status.isPlaying,
        processingTime: `${processingTime}ms`,
        action: "status_updated",
      });

      this.broadcastUserListeningStatus(userId);
    });

    socket.on("listening:subscribe", async (targetUserId: string) => {
      const socketInfo = this.socketToDevice.get(socket.id);
      if (!socketInfo) {
        socketLogger.event("listening:subscribe", socket.id, {
          level: "warn",
          action: "unauthenticated",
        });
        return;
      }

      const { userId: myUserId } = socketInfo;

      const canControl = await musicControlService.canControl(
        myUserId,
        targetUserId,
      );
      if (!canControl) {
        socket.emit("listening:error", {
          message: "Not authorized to view this user's listening status",
          code: "NOT_AUTHORIZED",
        });
        return;
      }

      void socket.join(`listening:${targetUserId}`);

      const userDevices = this.listeningStatuses.get(targetUserId);
      const devices = userDevices ? Array.from(userDevices.values()) : [];

      const userStatus: UserListeningStatus = {
        ownerId: targetUserId,
        devices,
      };
      socket.emit("listening:status", userStatus);

      socketLogger.auth("subscribe", myUserId, socket.id, {
        targetUserId,
        devicesOnline: devices.length,
        action: "subscribed",
      });
    });

    socket.on("listening:unsubscribe", (targetUserId: string) => {
      void socket.leave(`listening:${targetUserId}`);
      socketLogger.auth("unsubscribe", targetUserId, socket.id, {
        room: `listening:${targetUserId}`,
        action: "unsubscribed",
      });
    });

    socket.on("control:action", async (data: ControlActionPayload) => {
      const startTime = Date.now();

      const socketInfo = this.socketToDevice.get(socket.id);
      if (!socketInfo) {
        socketLogger.event("control:action", socket.id, {
          level: "warn",
          action: "unauthenticated",
        });
        return;
      }

      const { userId: controllerId } = socketInfo;

      const canControl = await musicControlService.canControl(
        controllerId,
        data.targetUserId,
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
        this.io.to(targetSocketId).emit("control:command", {
          action: data.action,
          fromUserId: controllerId,
        });

        const processingTime = Date.now() - startTime;
        socketLogger.event("control:action", socket.id, {
          controllerId,
          targetUserId: data.targetUserId,
          targetDeviceId: data.targetDeviceId,
          controlAction: data.action,
          processingTime: `${processingTime}ms`,
          action: "command_sent",
        });

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
  private broadcastUserListeningStatus(userId: string) {
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

    socketLogger.broadcast("device_status", {
      userId,
      room,
      deviceCount: devices.length,
      subscriberCount,
      action: "broadcasted",
    });

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

      this.broadcastUserListeningStatus(userId);

      this.socketToDevice.delete(socket.id);
      this.deviceToSocket.delete(deviceKey);

      socketLogger.event("device:cleanup", socket.id, {
        userId,
        deviceId,
        action: "cleaned_up",
      });
    }
  }

  /**
   * Notify all clients watching a playlist that it was updated
   */
  notifyPlaylistUpdate(
    playlistId: string,
    event: "track_added",
    data: TrackAddedPayload,
  ): void;
  notifyPlaylistUpdate(
    playlistId: string,
    event: "track_removed",
    data: TrackRemovedPayload,
  ): void;
  notifyPlaylistUpdate(playlistId: string, event: "reordered"): void;
  notifyPlaylistUpdate(
    playlistId: string,
    event: "track_added" | "track_removed" | "reordered",
    data?: PlaylistEventPayload,
  ) {
    if (!this.io) {
      socketLogger.event("playlist:updated", "N/A", {
        level: "warn",
        playlistId,
        event,
        action: "not_initialized",
      });
      return;
    }

    this.io
      .to(`playlist:${playlistId}`)
      .emit("playlist:updated", { playlistId, event, ...data });

    socketLogger.broadcast("playlist_updated", {
      playlistId,
      event,
      room: `playlist:${playlistId}`,
      action: "broadcasted",
    });
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
    granted: boolean,
  ) {
    if (!this.io) return;

    this.io.to(`user:${targetUserId}`).emit("permission:changed", {
      ownerId,
      targetUserId,
      canControl: granted,
    });

    socketLogger.broadcast("permission_changed", {
      ownerId,
      targetUserId,
      granted,
      room: `user:${targetUserId}`,
      action: granted ? "granted" : "revoked",
    });
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
