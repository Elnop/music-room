import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as trackEdits from '@/features/playlists/features/editor/shared/track-edits/lib/trackEdits';
import { moveTrack } from '@/features/playlists/features/editor/shared/track-edits/lib/trackMoves';
import type { AddQueueItemBody } from '@/shared/playback/lib/playback';

export function useAddTrack() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: ({ playlistId, track }: { playlistId: string; track: AddQueueItemBody }) =>
			trackEdits.addTrack(client, playlistId, track),
	});
}

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

export function useMoveTrack() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: ({ playlistId, trackId, afterRank }: MoveVariables) =>
			moveTrack(client, playlistId, trackId, afterRank),
	});
}
