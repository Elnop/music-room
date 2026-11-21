import { useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { logger } from '@/shared/logging/logger';
import { afterRankForDrop } from '@/shared/tracks/lib/moveTarget';
import { showError } from '@/shared/theme/lib/toast';
import { useMoveTrack } from '@/features/playlists/features/editor/shared/track-edits/useTrackEdits';
import { isOnScreen } from '@/features/playlists/shared/playlist/lib/playlistCache';
import { isMoveConflict } from '@/features/playlists/features/editor/shared/track-edits/lib/trackMoves';
import { CONFLICT_MESSAGE } from '@/features/playlists/features/editor/shared/track-edits/moveConflictConfig';
import type { PlaylistWithTracks } from '@/features/playlists/shared/playlist/playlistTypes';

export function useTrackReorder(
	id: string,
	playlist: PlaylistWithTracks | undefined
): (from: number, to: number) => Promise<void> {
	const client = useQueryClient();
	const moveTrack = useMoveTrack();

	return async function reorder(from: number, to: number) {
		const tracks = playlist?.tracks ?? [];
		const afterRank = afterRankForDrop(tracks, from, to);
		if (afterRank === undefined) return;
		try {
			await moveTrack.mutateAsync({ playlistId: id, trackId: tracks[from].id, afterRank });
		} catch (error) {
			if (!isMoveConflict(error)) {
				logger.error('[PlaylistDetailScreen] Move track failed:', error);
				showError(apiErrorMessage(error, 'Impossible de déplacer le titre'));
			} else if (isOnScreen(client, id)) {
				showError(CONFLICT_MESSAGE);
			}
			throw error;
		}
	};
}
