import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/shared/backend/lib/authSession';
import type { PlaybackActions, PlaylistPlayback } from '@/shared/playback/lib/playbackActions';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { logger } from '@/shared/logging/logger';
import { afterRankForDrop } from '@/shared/tracks/lib/moveTarget';
import { showError, showInfo, showSuccess } from '@/shared/theme/lib/toast';
import { toTrackInput } from '@/shared/tracks/lib/trackInput';
import {
	useMoveTrack,
	useRemoveTrack,
} from '@/features/playlists/features/editor/shared/track-edits/useTrackEdits';
import { usePendingMovesStore } from '@/features/playlists/features/editor/shared/track-edits/pendingMovesStore';
import { isOnScreen } from '@/features/playlists/shared/playlist/lib/playlistCache';
import { canEditPlaylist } from '@/features/playlists/features/editor/shared/permissions/playlistPermissions';
import {
	CONFLICT_MESSAGE,
	isMoveConflict,
} from '@/features/playlists/features/editor/shared/track-edits/lib/trackMoves';
import type { PlaylistWithTracks } from '@/features/playlists/shared/playlist/lib/types';
import type { AddQueueItemBody } from '@/shared/playback/lib/playback';
import type { TrackInPlaylist } from '@/shared/tracks/lib/track.types';
import { recordMenuAnchor } from '@/shared/theme/menuAnchorStore';
import type { MenuAnchor } from '@/shared/theme/lib/menuPlacement';

export type PlaylistTracks = {
	canEdit: boolean;
	isMoving: boolean;
	currentUri: string | null;
	actionTrack: AddQueueItemBody | null;
	showActions: (track: TrackInPlaylist, anchor?: MenuAnchor) => void;
	closeActions: () => void;
	addToQueue: (track: TrackInPlaylist) => void;
	explainUnavailable: () => void;
	deleteTrack: (trackId: string) => Promise<void>;
	reorder: (from: number, to: number) => Promise<void>;
};

export function usePlaylistTracks(
	id: string,
	playlist: PlaylistWithTracks | undefined,
	playback: PlaybackActions & PlaylistPlayback
): PlaylistTracks {
	const client = useQueryClient();
	const userId = useSession(session => session.user?.id);
	const { playingUri } = playback;
	const isMoving = usePendingMovesStore(state => state.count > 0);
	const removeTrack = useRemoveTrack();
	const moveTrack = useMoveTrack();
	const [actionTrack, setActionTrack] = useState<AddQueueItemBody | null>(null);
	const canEdit = canEditPlaylist(userId, playlist);

	async function deleteTrack(trackId: string) {
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
	}

	async function reorder(from: number, to: number) {
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
	}

	return {
		canEdit,
		isMoving,
		currentUri: playingUri,
		actionTrack,
		showActions: (track, anchor) => {
			recordMenuAnchor(anchor);
			setActionTrack(toTrackInput(track));
		},
		closeActions: () => setActionTrack(null),
		addToQueue: track => void playback.addToQueue(toTrackInput(track)),
		explainUnavailable: () => showInfo("Ce titre n'est plus disponible sur SoundCloud"),
		deleteTrack,
		reorder,
	};
}
