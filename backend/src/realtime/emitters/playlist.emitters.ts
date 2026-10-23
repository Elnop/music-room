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

/**
 * What the playlists feature sends to the `playlist:<id>` rooms. Each call is
 * a no-op (logged) before socket-server.ts initialize().
 */

type PlaylistEvent = 'playlist:updated' | 'playlist:details' | 'playlist:deleted';

/** Emit `event` to the playlist's room and log the broadcast under `broadcastName`. */
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

/**
 * Notify all clients watching a playlist of one track operation and the
 * version it produced (doc/features/playlist-concurrency.md, "Broadcast and convergence")
 */
export function notifyPlaylistUpdate(payload: PlaylistUpdatedPayload): void {
	const { event, tracksVersion } = payload;
	emitToPlaylistRoom('playlist:updated', 'playlist_updated', payload, { event, tracksVersion });
}

/**
 * Notify all clients watching a playlist of its new metadata (name,
 * description, visibility, edit mode) after an update (#342)
 */
export function notifyPlaylistDetails(payload: PlaylistDetailsPayload): void {
	emitToPlaylistRoom('playlist:details', 'playlist_details', payload);
}

/**
 * Tell all clients watching a playlist that it was deleted (#342). Must run
 * before revalidatePlaylistRoom evicts them from the room.
 */
export function notifyPlaylistDeleted(payload: PlaylistDeletedPayload): void {
	emitToPlaylistRoom('playlist:deleted', 'playlist_deleted', payload);
}

/**
 * Re-check access of every socket in a playlist room and evict those that
 * lost it (see playlist-room.ts). Never throws; no-op before initialize.
 */
export async function revalidatePlaylistRoom(playlistId: string): Promise<void> {
	const io = getIO();
	if (!io) return;
	await revalidateRoom(io, playlistId);
}
