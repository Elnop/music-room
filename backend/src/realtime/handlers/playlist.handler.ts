import { socketLogger } from '@/shared/middleware/socket-logger.middleware.js';
import type { AppSocket } from '@/realtime/socket-auth.js';
import {
	authorizePlaylistJoin,
	playlistRoom,
	playlistRoomPayloadSchema,
} from '@/realtime/playlist-room.js';
import { createSocketQueue } from '@/realtime/socket-queue.js';

/**
 * Join `playlist:<id>` if the user can view the playlist, else emit
 * `playlist:error` (see playlist-room.ts).
 */
async function joinPlaylistRoom(socket: AppSocket, payload: unknown): Promise<void> {
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
 * Playlist event handlers: playlist:join, playlist:leave
 */
export function registerPlaylistHandlers(socket: AppSocket): void {
	// join awaits a DB lookup while leave does not: run this socket's
	// join/leave events one after another, in arrival order, so a quick
	// join(A) + leave(A) never ends with the socket in the room.
	const enqueue = createSocketQueue(socket, 'playlist_room_task_failed');

	socket.on('playlist:join', (payload: unknown) => {
		enqueue(() => joinPlaylistRoom(socket, payload));
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
