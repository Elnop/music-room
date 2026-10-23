import { socketLogger } from '@/shared/middleware/socket-logger.middleware.js';
import type {
	PlaylistDeletedPayload,
	PlaylistDetailsPayload,
	PlaylistUpdatedPayload,
} from '@/features/playlists/playlist.types.js';
import {
	playlistRoom,
	revalidatePlaylistRoom as revalidateRoom,
} from '@/realtime/playlist-room.js';
import { getIO } from '@/realtime/state.js';

// Each call is a no-op (logged) before socket-server.ts initialize().

type PlaylistEvent = 'playlist:updated' | 'playlist:details' | 'playlist:deleted';

function emitToPlaylistRoom(
	event: PlaylistEvent,
	broadcastName: string,
	payload: { playlistId: string },
	logFields: Record<string, unknown> = {}
): void {
	const { playlistId } = payload;
	const io = getIO();
	if (!io) {
		socketLogger.event(event, 'N/A', {
			level: 'warn',
			playlistId,
			...logFields,
			action: 'not_initialized',
		});
		return;
	}

	const room = playlistRoom(playlistId);
	io.to(room).emit(event, payload);

	socketLogger.broadcast(broadcastName, {
		playlistId,
		...logFields,
		room,
		action: 'broadcasted',
	});
}

/** See doc/features/playlist-concurrency.md, "Broadcast and convergence". */
export function notifyPlaylistUpdate(payload: PlaylistUpdatedPayload): void {
	const { event, tracksVersion } = payload;
	emitToPlaylistRoom('playlist:updated', 'playlist_updated', payload, { event, tracksVersion });
}

export function notifyPlaylistDetails(payload: PlaylistDetailsPayload): void {
	emitToPlaylistRoom('playlist:details', 'playlist_details', payload);
}

/** Must run before revalidatePlaylistRoom evicts the clients from the room. */
export function notifyPlaylistDeleted(payload: PlaylistDeletedPayload): void {
	emitToPlaylistRoom('playlist:deleted', 'playlist_deleted', payload);
}

/** Evicts sockets that lost access (see playlist-room.ts). Never throws; no-op before initialize. */
export async function revalidatePlaylistRoom(playlistId: string): Promise<void> {
	const io = getIO();
	if (!io) return;
	await revalidateRoom(io, playlistId);
}
