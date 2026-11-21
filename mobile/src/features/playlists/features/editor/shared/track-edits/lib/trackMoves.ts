import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import { ApiError } from '@/shared/backend/lib/api';
import * as tracksApi from '@/features/playlists/features/editor/shared/track-edits/lib/tracksApi';
import { pendingMovesActions } from '@/features/playlists/features/editor/shared/track-edits/pendingMovesStore';
import { CONFLICT_CODES } from '@/features/playlists/features/editor/shared/track-edits/moveConflictConfig';
import type { PlaylistWithTracks } from '@/features/playlists/shared/playlist/playlistTypes';
import {
	isOnScreen,
	reloadIfOnScreen,
} from '@/features/playlists/shared/playlist/lib/playlistCache';
import { settleTrackEvent } from '@/features/playlists/features/editor/shared/track-edits/lib/settleTrackEvent';

type MoveRequest = {
	playlistId: string;
	trackId: string;
	afterRank: string | null;
};

export function isMoveConflict(error: unknown): error is ApiError {
	return error instanceof ApiError && CONFLICT_CODES.includes(error.code);
}

let moveQueue: Promise<unknown> = Promise.resolve();

async function sendMove(
	client: QueryClient,
	{ playlistId, trackId, afterRank }: MoveRequest,
	tracksVersion: number
): Promise<void> {
	const result = await tracksApi.moveTrack(playlistId, trackId, afterRank, tracksVersion);
	await settleTrackEvent(client, {
		playlistId,
		tracksVersion: result.tracksVersion,
		rebalanced: result.rebalanced,
		event: 'track_moved',
		trackId,
		rank: result.rank,
	});
}

async function runMove(client: QueryClient, request: MoveRequest): Promise<'moved' | 'skipped'> {
	const { playlistId } = request;
	const playlist = client.getQueryData<PlaylistWithTracks>(queryKeys.playlists.detail(playlistId));
	if (!playlist || !isOnScreen(client, playlistId)) return 'skipped';
	try {
		await sendMove(client, request, playlist.tracksVersion);
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
	pendingMovesActions.change(1);
	function run() {
		return runMove(client, { playlistId, trackId, afterRank }).finally(() =>
			pendingMovesActions.change(-1)
		);
	}
	const next = moveQueue.then(run, run);
	moveQueue = next.catch(() => undefined);
	return next;
}
