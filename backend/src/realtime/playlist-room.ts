import { z } from 'zod';
import { canViewPlaylist } from '@/features/playlists/permissions/playlist.permissions.js';
import type { PlaylistRow } from '@/features/playlists/playlist.types.js';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { socketLogger } from '@/shared/middleware/socket-logger.middleware.js';
import { logger } from '@/shared/utils/logger.js';
import type { AppSocketServer } from '@/realtime/socket-auth.js';
import { RATE_LIMITED } from '@/shared/security/socket-event-limit.js';

export const playlistRoomPayloadSchema = z.uuid();

export type PlaylistRoomErrorCode =
	'INVALID_PAYLOAD' | 'PLAYLIST_NOT_FOUND' | 'PLAYLIST_ACCESS_DENIED' | 'RATE_LIMITED';

export interface PlaylistRoomError {
	playlistId: string | null;
	code: PlaylistRoomErrorCode;
	message: string;
}

type PlaylistJoinResult = { ok: true; playlistId: string } | ({ ok: false } & PlaylistRoomError);

const MESSAGES: Record<PlaylistRoomErrorCode, string> = {
	INVALID_PAYLOAD: 'playlist:join expects a playlist id (UUID)',
	PLAYLIST_NOT_FOUND: 'Playlist not found',
	PLAYLIST_ACCESS_DENIED: 'Not authorized to view this playlist',
	RATE_LIMITED: RATE_LIMITED.message,
};

export function playlistRoom(playlistId: string): string {
	return `playlist:${playlistId}`;
}

function playlistRoomError(
	playlistId: string | null,
	code: PlaylistRoomErrorCode
): PlaylistRoomError {
	return { playlistId, code, message: MESSAGES[code] };
}

type PlaylistLookup =
	{ status: 'found'; playlist: PlaylistRow } | { status: 'not_found' } | { status: 'error' };

/** Tells a missing row apart from a failed lookup (logged). */
async function loadPlaylist(playlistId: string): Promise<PlaylistLookup> {
	try {
		const { data, error } = await supabaseAdmin
			.from('playlists')
			.select('*')
			.eq('id', playlistId)
			.maybeSingle();
		if (error) {
			logger.error('Playlist room lookup failed', { error, playlistId });
			return { status: 'error' };
		}
		return data ? { status: 'found', playlist: data } : { status: 'not_found' };
	} catch (error) {
		logger.error('Playlist room lookup failed', { error, playlistId });
		return { status: 'error' };
	}
}

export async function authorizePlaylistJoin(
	playlistId: unknown,
	userId: string
): Promise<PlaylistJoinResult> {
	const parsed = playlistRoomPayloadSchema.safeParse(playlistId);
	if (!parsed.success) {
		const raw = typeof playlistId === 'string' ? playlistId : null;
		return { ok: false, ...playlistRoomError(raw, 'INVALID_PAYLOAD') };
	}

	const id = parsed.data;
	const lookup = await loadPlaylist(id);
	// A failed lookup is answered as not found (the error is logged).
	if (lookup.status !== 'found') {
		return { ok: false, ...playlistRoomError(id, 'PLAYLIST_NOT_FOUND') };
	}
	if (!canViewPlaylist(lookup.playlist, userId)) {
		return { ok: false, ...playlistRoomError(id, 'PLAYLIST_ACCESS_DENIED') };
	}
	return { ok: true, playlistId: id };
}

/** Sockets without access leave and get `playlist:error`; none leave when the lookup failed. Never throws. */
export async function revalidatePlaylistRoom(
	io: AppSocketServer,
	playlistId: string
): Promise<void> {
	const room = playlistRoom(playlistId);
	try {
		const sockets = await io.in(room).fetchSockets();
		if (sockets.length === 0) return;

		const lookup = await loadPlaylist(playlistId);
		// Do not evict members of a playlist that may still exist.
		if (lookup.status === 'error') return;
		const playlist = lookup.status === 'found' ? lookup.playlist : null;

		for (const socket of sockets) {
			if (playlist && canViewPlaylist(playlist, socket.data.userId)) continue;

			const code: PlaylistRoomErrorCode = playlist
				? 'PLAYLIST_ACCESS_DENIED'
				: 'PLAYLIST_NOT_FOUND';
			socket.leave(room);
			socket.emit('playlist:error', playlistRoomError(playlistId, code));
			socketLogger.event('playlist:revalidate', socket.id, {
				level: 'warn',
				userId: socket.data.userId,
				playlistId,
				room,
				code,
				action: 'evicted',
			});
		}
	} catch (error) {
		logger.error('Playlist room revalidation failed', { error, playlistId });
	}
}
