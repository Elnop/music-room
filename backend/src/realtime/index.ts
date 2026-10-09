import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { socketLogger } from '@/shared/middleware/socket-logger.middleware.js';
import {
	authenticateSocket,
	type AppSocket,
	type AppSocketServer,
} from '@/realtime/socket-auth.js';
import { LatestThrottle } from '@/realtime/latest-throttle.js';
import {
	authorizePlaylistJoin,
	playlistRoom,
	playlistRoomPayloadSchema,
	revalidatePlaylistRoom,
} from '@/realtime/playlist-room.js';
import type { PlaylistUpdatedPayload } from '@/features/playlists/playlist.types.js';
import { controlAccessService } from '@/features/music-control/services/control-access.service.js';
import type {
	ListeningStatus,
	UserListeningStatus,
} from '@/features/music-control/music-control.types.js';
import {
	controlActionSchema,
	INVALID_CONTROL_PAYLOAD,
	INVALID_LISTENING_PAYLOAD,
	leaveListeningRoom,
	listeningRoom,
	listeningTargetSchema,
} from '@/realtime/music-control-access.js';

/**
 * Listening update payload from client.
 * Older clients may still send a `device` field: it is ignored, and the
 * device comes from the handshake (`socket.data.device`).
 */
interface ListeningUpdatePayload {
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
function isValidListeningUpdatePayload(data: unknown): data is ListeningUpdatePayload {
	if (!data || typeof data !== 'object') return false;
	const payload = data as Record<string, unknown>;

	if (typeof payload.isPlaying !== 'boolean') return false;

	if (payload.track !== null) {
		if (typeof payload.track !== 'object') return false;
		const track = payload.track as Record<string, unknown>;
		if (typeof track.title !== 'string') return false;
		if (typeof track.artist !== 'string') return false;
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
	private io: AppSocketServer | null = null;

	private listeningStatuses: Map<string, Map<string, ListeningStatus>> = new Map();

	private socketToDevice: Map<string, { userId: string; deviceId: string }> = new Map();

	private deviceToSocket: Map<string, string> = new Map();

	private static LISTENING_UPDATE_THROTTLE_MS = 1000;
	private listeningUpdateThrottle = new LatestThrottle(
		RealtimeService.LISTENING_UPDATE_THROTTLE_MS
	);

	/**
	 * Initialize Socket.io server
	 */
	initialize(httpServer: HTTPServer) {
		const corsOrigin = process.env.SOCKET_IO_CORS_ORIGIN || '*';

		socketLogger.init('initializing', { corsOrigin });

		this.io = new SocketIOServer(httpServer, {
			cors: {
				origin: corsOrigin,
				methods: ['GET', 'POST'],
				credentials: true,
			},
			transports: ['websocket', 'polling'],
			pingTimeout: 60000,
			pingInterval: 25000,
		});

		// Every connection must carry a valid token (see socket-auth.ts).
		this.io.use((socket, next) => {
			authenticateSocket(socket, next).catch(() => next(new Error('INVALID_TOKEN')));
		});

		this.io.on('connection', socket => {
			const transport = socket.conn.transport.name;
			socketLogger.connection(socket.id, transport, { action: 'connected' });

			socket.conn.on('upgrade', (newTransport: { name: string }) => {
				socketLogger.event('transport:upgraded', socket.id, {
					from: transport,
					to: newTransport.name,
					action: 'upgraded',
				});
			});

			// Every incoming event, including those added later, is logged with
			// the handshake's platform, device and app version (subject IV.6).
			socket.use(([eventName]: unknown[], next) => {
				socketLogger.incoming(socket.id, eventName, socket.data);
				next();
			});

			this.registerDevice(socket);
			this.registerPlaylistHandlers(socket);
			this.registerMusicControlHandlers(socket);

			socket.on('disconnect', reason => {
				this.handleDisconnect(socket);
				socketLogger.disconnect(socket.id, reason, { action: 'disconnected' });
			});

			socket.on('error', error => {
				socketLogger.error(socket.id, error, { action: 'error' });
			});
		});

		socketLogger.init('initialized', { action: 'ready' });
	}

	/**
	 * Register the handshake device for control and join the user's room.
	 * Identity comes from socket.data, filled by authenticateSocket.
	 */
	private registerDevice(socket: AppSocket) {
		const { userId, device } = socket.data;
		const deviceKey = `${userId}:${device.deviceId}`;

		this.socketToDevice.set(socket.id, { userId, deviceId: device.deviceId });
		this.deviceToSocket.set(deviceKey, socket.id);

		void socket.join(`user:${userId}`);

		socketLogger.auth('register', userId, socket.id, {
			deviceId: device.deviceId,
			deviceName: device.deviceName,
			action: 'device_registered',
		});
	}

	/**
	 * Playlist event handlers
	 */
	private registerPlaylistHandlers(socket: AppSocket) {
		// join awaits a DB lookup while leave does not: run this socket's
		// join/leave events one after another, in arrival order, so a quick
		// join(A) + leave(A) never ends with the socket in the room.
		let queue: Promise<void> = Promise.resolve();
		const enqueue = (task: () => Promise<void> | void) => {
			queue = queue.then(task).catch((error: unknown) => {
				socketLogger.error(socket.id, error instanceof Error ? error : new Error(String(error)), {
					action: 'playlist_room_task_failed',
				});
			});
		};

		socket.on('playlist:join', (payload: unknown) => {
			enqueue(() => this.joinPlaylistRoom(socket, payload));
		});

		socket.on('playlist:leave', (payload: unknown) => {
			enqueue(() => {
				const parsed = playlistRoomPayloadSchema.safeParse(payload);
				if (!parsed.success) return;

				const room = playlistRoom(parsed.data);
				void socket.leave(room);
				socketLogger.event('playlist:leave', socket.id, {
					playlistId: parsed.data,
					room,
					action: 'left',
				});
			});
		});
	}

	/**
	 * Join `playlist:<id>` if the user can view the playlist, else emit
	 * `playlist:error` (see playlist-room.ts).
	 */
	private async joinPlaylistRoom(socket: AppSocket, payload: unknown): Promise<void> {
		const { userId } = socket.data;
		const result = await authorizePlaylistJoin(payload, userId);

		if (!result.ok) {
			const { ok: _ok, ...error } = result;
			socket.emit('playlist:error', error);
			socketLogger.event('playlist:join', socket.id, {
				level: 'warn',
				userId,
				playlistId: error.playlistId,
				code: error.code,
				action: 'refused',
			});
			return;
		}

		const room = playlistRoom(result.playlistId);
		void socket.join(room);
		socketLogger.event('playlist:join', socket.id, {
			userId,
			playlistId: result.playlistId,
			room,
			action: 'joined',
		});
	}

	/**
	 * Music control handlers - multi-device support
	 */
	private registerMusicControlHandlers(socket: AppSocket) {
		socket.on('listening:update', (data: unknown) => {
			if (!isValidListeningUpdatePayload(data)) {
				socketLogger.event('listening:update', socket.id, {
					level: 'warn',
					action: 'invalid_payload',
				});
				return;
			}

			const socketInfo = this.socketToDevice.get(socket.id);
			if (!socketInfo) {
				socketLogger.event('listening:update', socket.id, {
					level: 'warn',
					action: 'unauthenticated',
				});
				return;
			}

			const { userId, deviceId } = socketInfo;
			// Leading + trailing: the first update applies now, the latest one
			// received during the window applies when it ends (#151).
			this.listeningUpdateThrottle.submit(`${userId}:${deviceId}`, () =>
				this.applyListeningUpdate(socket, userId, deviceId, data)
			);
		});

		socket.on('listening:subscribe', async (payload: unknown) => {
			const parsed = listeningTargetSchema.safeParse(payload);
			if (!parsed.success) {
				socket.emit('listening:error', INVALID_LISTENING_PAYLOAD);
				socketLogger.event('listening:subscribe', socket.id, {
					level: 'warn',
					action: 'invalid_payload',
				});
				return;
			}
			const targetUserId = parsed.data;

			const socketInfo = this.socketToDevice.get(socket.id);
			if (!socketInfo) {
				socketLogger.event('listening:subscribe', socket.id, {
					level: 'warn',
					action: 'unauthenticated',
				});
				return;
			}

			const { userId: myUserId } = socketInfo;

			// Access to at least one device shows the status of all of them.
			const canControl = await controlAccessService.canControlAnyDevice(myUserId, targetUserId);
			if (!canControl) {
				socket.emit('listening:error', {
					message: "Not authorized to view this user's listening status",
					code: 'NOT_AUTHORIZED',
				});
				return;
			}

			const room = listeningRoom(targetUserId);
			void socket.join(room);

			// A revoke or unfollow whose revalidation ran during the check above
			// found nothing to evict: re-check now that the socket is in the room.
			if (!(await controlAccessService.canControlAnyDevice(myUserId, targetUserId))) {
				void socket.leave(room);
				socket.emit('listening:error', {
					message: "Not authorized to view this user's listening status",
					code: 'NOT_AUTHORIZED',
				});
				return;
			}

			const userDevices = this.listeningStatuses.get(targetUserId);
			const devices = userDevices ? Array.from(userDevices.values()) : [];

			const userStatus: UserListeningStatus = {
				ownerId: targetUserId,
				devices,
			};
			socket.emit('listening:status', userStatus);

			socketLogger.auth('subscribe', myUserId, socket.id, {
				targetUserId,
				devicesOnline: devices.length,
				action: 'subscribed',
			});
		});

		socket.on('listening:unsubscribe', (payload: unknown) => {
			const parsed = listeningTargetSchema.safeParse(payload);
			if (!parsed.success) return;

			const targetUserId = parsed.data;
			void socket.leave(listeningRoom(targetUserId));
			socketLogger.auth('unsubscribe', targetUserId, socket.id, {
				room: listeningRoom(targetUserId),
				action: 'unsubscribed',
			});
		});

		socket.on('control:action', async (payload: unknown) => {
			const startTime = Date.now();

			// Unknown keys (e.g. a forged fromUserId) are stripped: the sender
			// is always the socket's user.
			const parsed = controlActionSchema.safeParse(payload);
			if (!parsed.success) {
				socket.emit('control:error', INVALID_CONTROL_PAYLOAD);
				socketLogger.event('control:action', socket.id, {
					level: 'warn',
					action: 'invalid_payload',
				});
				return;
			}
			const data = parsed.data;

			const socketInfo = this.socketToDevice.get(socket.id);
			if (!socketInfo) {
				socketLogger.event('control:action', socket.id, {
					level: 'warn',
					action: 'unauthenticated',
				});
				return;
			}

			const { userId: controllerId } = socketInfo;

			// Checked before the device lookup: a refused controller learns
			// nothing about which devices are online.
			const canControl = await controlAccessService.canControlDevice(
				controllerId,
				data.targetUserId,
				data.targetDeviceId
			);
			if (!canControl) {
				socket.emit('control:error', {
					message: "Not authorized to control this user's music",
					code: 'NOT_AUTHORIZED',
				});
				return;
			}

			const targetDeviceKey = `${data.targetUserId}:${data.targetDeviceId}`;
			const targetSocketId = this.deviceToSocket.get(targetDeviceKey);

			if (targetSocketId && this.io) {
				this.io.to(targetSocketId).emit('control:command', {
					action: data.action,
					fromUserId: controllerId,
				});

				const processingTime = Date.now() - startTime;
				socketLogger.event('control:action', socket.id, {
					controllerId,
					targetUserId: data.targetUserId,
					targetDeviceId: data.targetDeviceId,
					controlAction: data.action,
					processingTime: `${processingTime}ms`,
					action: 'command_sent',
				});

				socket.emit('control:success', {
					action: data.action,
					targetUserId: data.targetUserId,
					targetDeviceId: data.targetDeviceId,
				});
			} else {
				socket.emit('control:error', {
					message: 'Target device is not online',
					code: 'DEVICE_OFFLINE',
				});
			}
		});
	}

	/**
	 * Broadcast all devices' listening status for a user
	 */
	private broadcastUserListeningStatus(userId: string) {
		if (!this.io) return;

		const room = listeningRoom(userId);
		const socketsInRoom = this.io.sockets.adapter.rooms.get(room);
		const subscriberCount = socketsInRoom ? socketsInRoom.size : 0;

		const userDevices = this.listeningStatuses.get(userId);
		const devices = userDevices ? Array.from(userDevices.values()) : [];

		const userStatus: UserListeningStatus = {
			ownerId: userId,
			devices,
		};

		socketLogger.broadcast('device_status', {
			userId,
			room,
			deviceCount: devices.length,
			subscriberCount,
			action: 'broadcasted',
		});

		this.io.to(room).emit('listening:status', userStatus);
	}

	/**
	 * Store a device's listening status and broadcast it to the user's subscribers.
	 */
	private applyListeningUpdate(
		socket: AppSocket,
		userId: string,
		deviceId: string,
		data: ListeningUpdatePayload
	) {
		const startTime = Date.now();

		let userDevices = this.listeningStatuses.get(userId);
		if (!userDevices) {
			userDevices = new Map();
			this.listeningStatuses.set(userId, userDevices);
		}

		const status: ListeningStatus = {
			ownerId: userId,
			device: socket.data.device,
			track: data.track,
			isPlaying: data.isPlaying,
			updatedAt: new Date().toISOString(),
		};
		userDevices.set(deviceId, status);

		const processingTime = Date.now() - startTime;
		socketLogger.event('listening:update', socket.id, {
			userId,
			deviceId,
			deviceName: socket.data.device.deviceName,
			track: status.track?.title,
			isPlaying: status.isPlaying,
			processingTime: `${processingTime}ms`,
			action: 'status_updated',
		});

		this.broadcastUserListeningStatus(userId);
	}

	/**
	 * Handle socket disconnect - cleanup only the disconnected device
	 */
	private handleDisconnect(socket: AppSocket) {
		const socketInfo = this.socketToDevice.get(socket.id);
		if (socketInfo) {
			const { userId, deviceId } = socketInfo;
			const deviceKey = `${userId}:${deviceId}`;

			this.socketToDevice.delete(socket.id);

			// The device reconnected on a newer socket: leave its state to that socket.
			if (this.deviceToSocket.get(deviceKey) !== socket.id) return;

			const userDevices = this.listeningStatuses.get(userId);
			if (userDevices) {
				userDevices.delete(deviceId);
				if (userDevices.size === 0) {
					this.listeningStatuses.delete(userId);
				}
			}

			this.listeningUpdateThrottle.cancel(deviceKey);

			this.broadcastUserListeningStatus(userId);

			this.deviceToSocket.delete(deviceKey);

			socketLogger.event('device:cleanup', socket.id, {
				userId,
				deviceId,
				action: 'cleaned_up',
			});
		}
	}

	/**
	 * Notify all clients watching a playlist of one track operation and the
	 * version it produced (doc/PLAYLIST_CONCURRENCY.md, "Broadcast and convergence")
	 */
	notifyPlaylistUpdate(payload: PlaylistUpdatedPayload): void {
		const { playlistId, event, tracksVersion } = payload;
		if (!this.io) {
			socketLogger.event('playlist:updated', 'N/A', {
				level: 'warn',
				playlistId,
				event,
				action: 'not_initialized',
			});
			return;
		}

		this.io.to(`playlist:${playlistId}`).emit('playlist:updated', payload);

		socketLogger.broadcast('playlist_updated', {
			playlistId,
			event,
			tracksVersion,
			room: `playlist:${playlistId}`,
			action: 'broadcasted',
		});
	}

	/**
	 * Re-check access of every socket in a playlist room and evict those that
	 * lost it (see playlist-room.ts). Never throws; no-op before initialize.
	 */
	async revalidatePlaylistRoom(playlistId: string): Promise<void> {
		if (!this.io) return;
		await revalidatePlaylistRoom(this.io, playlistId);
	}

	/**
	 * Re-check `controllerId`'s access to `ownerId`'s devices after a change
	 * (switch or license revoked, unfollow) and make its sockets leave
	 * `listening:<ownerId>` only when no device is left. A failed check
	 * evicts (fail closed). Never throws; no-op before initialize.
	 */
	async revalidateListeningAccess(controllerId: string, ownerId: string): Promise<void> {
		if (!this.io) return;
		if (await controlAccessService.canControlAnyDevice(controllerId, ownerId)) return;
		leaveListeningRoom(this.io, controllerId, ownerId);
	}

	/**
	 * Get the Socket.io server instance (for advanced use cases)
	 */
	getIO(): AppSocketServer | null {
		return this.io;
	}

	/**
	 * Notify a user that their music control permission has changed
	 * Called when someone grants or revokes control to them
	 */
	async notifyPermissionChange(
		targetUserId: string,
		ownerId: string,
		granted: boolean
	): Promise<void> {
		if (!this.io) return;

		// A license may still give access to some device: re-check, not leave.
		if (!granted) await this.revalidateListeningAccess(targetUserId, ownerId);

		this.io.to(`user:${targetUserId}`).emit('permission:changed', {
			ownerId,
			targetUserId,
			canControl: granted,
		});

		socketLogger.broadcast('permission_changed', {
			ownerId,
			targetUserId,
			granted,
			room: `user:${targetUserId}`,
			action: granted ? 'granted' : 'revoked',
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
