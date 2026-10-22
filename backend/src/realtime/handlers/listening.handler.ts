import { socketLogger } from '@/shared/middleware/socket-logger.middleware.js';
import * as controlAccessService from '@/features/music-control/services/control-access.service.js';
import type { AppSocket } from '@/realtime/socket-auth.js';
import {
	INVALID_LISTENING_PAYLOAD,
	INVALID_LISTENING_UPDATE_PAYLOAD,
	listeningRoom,
	listeningTargetSchema,
	listeningUpdateSchema,
} from '@/realtime/music-control-access.js';
import {
	applyListeningUpdate,
	getUserListeningStatus,
	listeningUpdateThrottle,
} from '@/realtime/listening-status.js';
import { createSocketQueue } from '@/realtime/socket-queue.js';
import { deviceKey, socketToDevice } from '@/realtime/state.js';

/**
 * Join `listening:<target>` if the user can control at least one of the
 * target's devices, then send the current status; else emit `listening:error`.
 */
async function subscribeToListening(socket: AppSocket, payload: unknown): Promise<void> {
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

	const socketInfo = socketToDevice.get(socket.id);
	if (!socketInfo) {
		socketLogger.event('listening:subscribe', socket.id, {
			level: 'warn',
			action: 'unauthenticated',
		});
		return;
	}

	const { userId: myUserId } = socketInfo;
	const denyListening = () =>
		socket.emit('listening:error', {
			message: "Not authorized to view this user's listening status",
			code: 'NOT_AUTHORIZED',
		});

	// Access to at least one device shows the status of all of them.
	const canControl = await controlAccessService.canControlAnyDevice(myUserId, targetUserId);
	if (!canControl) {
		denyListening();
		return;
	}

	const room = listeningRoom(targetUserId);
	void socket.join(room);

	// A revoke or unfollow whose revalidation ran during the check above
	// found nothing to evict: re-check now that the socket is in the room.
	if (!(await controlAccessService.canControlAnyDevice(myUserId, targetUserId))) {
		void socket.leave(room);
		denyListening();
		return;
	}

	const userStatus = getUserListeningStatus(targetUserId);
	socket.emit('listening:status', userStatus);

	socketLogger.auth('subscribe', myUserId, socket.id, {
		targetUserId,
		devicesOnline: userStatus.devices.length,
		action: 'subscribed',
	});
}

/**
 * Listening event handlers: listening:update, listening:subscribe,
 * listening:unsubscribe (multi-device)
 */
export function registerListeningHandlers(socket: AppSocket): void {
	socket.on('listening:update', (payload: unknown) => {
		const parsed = listeningUpdateSchema.safeParse(payload);
		if (!parsed.success) {
			socket.emit('listening:error', INVALID_LISTENING_UPDATE_PAYLOAD);
			socketLogger.event('listening:update', socket.id, {
				level: 'warn',
				action: 'invalid_payload',
			});
			return;
		}
		const data = parsed.data;

		const socketInfo = socketToDevice.get(socket.id);
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
		listeningUpdateThrottle.submit(deviceKey(userId, deviceId), () =>
			applyListeningUpdate(socket, userId, deviceId, data)
		);
	});

	// subscribe awaits access checks while unsubscribe does not: same
	// ordering as playlist join/leave, so a quick subscribe(X) +
	// unsubscribe(X) never ends with the socket in the room (#159).
	const enqueue = createSocketQueue(socket, 'listening_room_task_failed');

	socket.on('listening:subscribe', (payload: unknown) => {
		enqueue(() => subscribeToListening(socket, payload));
	});

	socket.on('listening:unsubscribe', (payload: unknown) => {
		enqueue(() => {
			const parsed = listeningTargetSchema.safeParse(payload);
			if (!parsed.success) return;

			const targetUserId = parsed.data;
			void socket.leave(listeningRoom(targetUserId));
			socketLogger.auth('unsubscribe', targetUserId, socket.id, {
				room: listeningRoom(targetUserId),
				action: 'unsubscribed',
			});
		});
	});
}
