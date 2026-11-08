import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { ApiError } from '@/shared/services/api';
import * as tracksApi from '@/features/playlists/services/tracksApi';
import { usePendingMovesStore } from '@/features/playlists/stores/pendingMovesStore';
import type { PlaylistWithTracks } from '@/features/playlists/types';
import { isOnScreen, reloadIfOnScreen, settleTrackEvent } from './playlistCache';

const CONFLICT_CODES = ['TRACK_MOVED_CONCURRENTLY', 'TRACK_NOT_IN_PLAYLIST', 'PLAYLIST_REBALANCED'];

export const CONFLICT_MESSAGE = "Ce titre a été modifié par quelqu'un d'autre";

export function isMoveConflict(error: unknown): error is ApiError {
	return error instanceof ApiError && CONFLICT_CODES.includes(error.code);
}

let moveQueue: Promise<unknown> = Promise.resolve();

async function sendMove(
	client: QueryClient,
	playlistId: string,
	trackId: string,
	afterRank: string | null
): Promise<'moved' | 'skipped'> {
	const playlist = client.getQueryData<PlaylistWithTracks>(queryKeys.playlists.detail(playlistId));
	if (!playlist || !isOnScreen(client, playlistId)) return 'skipped';
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
		if (isMoveConflict(error)) await reloadIfOnScreen(client, playlistId);
		throw error;
	}
}

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
