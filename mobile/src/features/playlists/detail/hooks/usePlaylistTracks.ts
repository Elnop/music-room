import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/shared/services/authSession';
import { getPlayback, usePlaylistPlayback } from '@/shared/services/playbackBridge';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { logger } from '@/shared/utils/logger';
import { afterRankForDrop } from '@/shared/utils/moveTarget';
import { showError, showSuccess } from '@/shared/utils/toast';
import { toTrackInput } from '@/shared/utils/trackInput';
import { useMoveTrack, useRemoveTrack } from '@/features/playlists/hooks/useTrackEdits';
import { usePendingMovesStore } from '@/features/playlists/stores/pendingMovesStore';
import { isOpen } from '@/features/playlists/utils/playlistCache';
import { canEditPlaylist } from '@/features/playlists/utils/playlistPermissions';
import { CONFLICT_MESSAGE, isMoveConflict } from '@/features/playlists/utils/trackMoves';
import type { PlaylistWithTracks } from '@/features/playlists/types';
import type { AddQueueItemBody } from '@/shared/types/playback';
import type { TrackInPlaylist } from '@/types/track.types';

export interface PlaylistTracks {
	canEdit: boolean;
	/** Drag is off while a move is on its way. */
	isMoving: boolean;
	/** Permalink of the track playing from this playlist's queue block (#307), else null. */
	currentUri: string | null;
	/** The track whose quick actions are open. */
	actionTrack: AddQueueItemBody | null;
	showActions: (track: TrackInPlaylist) => void;
	closeActions: () => void;
	addToQueue: (track: TrackInPlaylist) => void;
	deleteTrack: (trackId: string) => Promise<void>;
	/** Rejects on failure, so the list drops its local order and shows the cached one again. */
	reorder: (from: number, to: number) => Promise<void>;
}

/** The tracks of an open playlist: highlight, quick actions, swipe to delete, drag to move. */
export function usePlaylistTracks(
	id: string,
	playlist: PlaylistWithTracks | undefined
): PlaylistTracks {
	const client = useQueryClient();
	const userId = useSession(session => session.user?.id);
	const { playingUri } = usePlaylistPlayback(id);
	const isMoving = usePendingMovesStore(state => state.count > 0);
	const removeTrack = useRemoveTrack();
	const moveTrack = useMoveTrack();
	const [actionTrack, setActionTrack] = useState<AddQueueItemBody | null>(null);
	const canEdit = canEditPlaylist(userId, playlist);

	const deleteTrack = async (trackId: string) => {
		if (!canEdit) {
			showError('Vous ne pouvez pas éditer cette playlist');
			return;
		}
		try {
			await removeTrack.mutateAsync({ playlistId: id, trackId });
			showSuccess('Titre supprimé');
		} catch (error) {
			logger.error('[PlaylistDetailScreen] Remove track failed:', error);
			showError(apiErrorMessage(error, 'Impossible de supprimer le titre'));
		}
	};

	const reorder = async (from: number, to: number) => {
		const tracks = playlist?.tracks ?? [];
		const afterRank = afterRankForDrop(tracks, from, to);
		if (afterRank === undefined) return;
		try {
			await moveTrack.mutateAsync({ playlistId: id, trackId: tracks[from].id, afterRank });
		} catch (error) {
			if (!isMoveConflict(error)) {
				logger.error('[PlaylistDetailScreen] Move track failed:', error);
				showError(apiErrorMessage(error, 'Impossible de déplacer le titre'));
			} else if (isOpen(client, id)) {
				// The playlist was reloaded; tell the user only if it is still on screen.
				showError(CONFLICT_MESSAGE);
			}
			throw error;
		}
	};

	return {
		canEdit,
		isMoving,
		currentUri: playingUri,
		actionTrack,
		showActions: track => setActionTrack(toTrackInput(track)),
		closeActions: () => setActionTrack(null),
		addToQueue: track => void getPlayback().addToQueue(toTrackInput(track)),
		deleteTrack,
		reorder,
	};
}
