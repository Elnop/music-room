import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { ApiError } from '@/shared/services/api';
import * as tracksApi from '@/features/playlists/services/tracksApi';
import { usePendingMovesStore } from '@/features/playlists/stores/pendingMovesStore';
import type { PlaylistWithTracks } from '@/features/playlists/types';
import { isOpen, reloadIfOpen, settleTrackEvent } from './playlistCache';

/** Refusals of a move that mean the track changed under us: reload and tell the user. */
const CONFLICT_CODES = ['TRACK_MOVED_CONCURRENTLY', 'TRACK_NOT_IN_PLAYLIST', 'PLAYLIST_REBALANCED'];

export const CONFLICT_MESSAGE = "Ce titre a été modifié par quelqu'un d'autre";

export function isMoveConflict(error: unknown): error is ApiError {
	return error instanceof ApiError && CONFLICT_CODES.includes(error.code);
}

// Moves from this client go one at a time: each one is sent with the version the
// previous one returned, so a quick second move is never refused against ourselves.
let moveQueue: Promise<unknown> = Promise.resolve();

async function sendMove(
	client: QueryClient,
	playlistId: string,
	trackId: string,
	afterRank: string | null
): Promise<'moved' | 'skipped'> {
	const playlist = client.getQueryData<PlaylistWithTracks>(queryKeys.playlists.detail(playlistId));
	if (!playlist || !isOpen(client, playlistId)) return 'skipped';
	try {
		const result = await tracksApi.moveTrack(
			playlistId,
			trackId,
			afterRank,
			playlist.tracksVersion
		);
		await settleTrackEvent(client, {
			playlistId,
			tracksVersion: result.tracksVersion,
			rebalanced: result.rebalanced,
			event: 'track_moved',
			trackId,
			rank: result.rank,
		});
		return 'moved';
	} catch (error) {
		if (isMoveConflict(error)) await reloadIfOpen(client, playlistId);
		throw error;
	}
}

/**
 * Moves a track right after `afterRank` (null = top), queued behind the
 * previous move. Resolves 'skipped' (nothing sent) once the playlist is no
 * longer on screen; rejects with the ApiError, after a reload on a conflict.
 */
export function moveTrack(
	client: QueryClient,
	playlistId: string,
	trackId: string,
	afterRank: string | null
): Promise<'moved' | 'skipped'> {
	const { change } = usePendingMovesStore.getState();
	change(1);
	const run = () => sendMove(client, playlistId, trackId, afterRank).finally(() => change(-1));
	const next = moveQueue.then(run, run);
	moveQueue = next.catch(() => undefined);
	return next;
}
