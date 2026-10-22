import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as trackEdits from '@/features/playlists/utils/trackEdits';
import { moveTrack } from '@/features/playlists/utils/trackMoves';
import type { AddQueueItemBody } from '@/shared/types/playback';

/** Adds a track to a playlist: `mutateAsync({ playlistId, track })`. */
export function useAddTrack() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: ({ playlistId, track }: { playlistId: string; track: AddQueueItemBody }) =>
			trackEdits.addTrack(client, playlistId, track),
	});
}

/** Removes a track at once from the screen: `mutateAsync({ playlistId, trackId })`. */
export function useRemoveTrack() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: ({ playlistId, trackId }: { playlistId: string; trackId: string }) =>
			trackEdits.removeTrack(client, playlistId, trackId),
	});
}

interface MoveVariables {
	playlistId: string;
	trackId: string;
	afterRank: string | null;
}

/** Moves a track, queued behind the previous move (utils/trackMoves.ts). */
export function useMoveTrack() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: ({ playlistId, trackId, afterRank }: MoveVariables) =>
			moveTrack(client, playlistId, trackId, afterRank),
	});
}
