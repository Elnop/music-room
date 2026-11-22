import { useState } from 'react';
import { useSession } from '@/shared/backend/hooks/useSession';
import type {
	PlaybackActions,
	PlaylistPlayback,
} from '@/shared/playback/types/playbackActionsTypes';
import { showInfo } from '@/shared/theme/lib/toast';
import { toTrackInput } from '@/shared/tracks/lib/toTrackInput';
import { usePendingMovesState } from '@/features/playlists/features/editor/features/detail/hooks/usePendingMovesState';
import { useTrackDelete } from '@/features/playlists/features/editor/features/detail/hooks/useTrackDelete';
import { useTrackReorder } from '@/features/playlists/features/editor/features/detail/hooks/useTrackReorder';
import { canEditPlaylist } from '@/features/playlists/features/editor/shared/permissions/canEditPlaylist';
import type { PlaylistWithTracks } from '@/features/playlists/shared/playlist/playlistTypes';
import type { AddQueueItemBody } from '@/shared/playback/types/playbackTypes';
import { menuAnchorActions } from '@/shared/theme/menuAnchorStore';
import type { PlaylistTracks } from '@/features/playlists/features/editor/features/detail/types/playlistTracksTypes';

export function usePlaylistTracks(
	id: string,
	playlist: PlaylistWithTracks | undefined,
	playback: PlaybackActions & PlaylistPlayback,
): PlaylistTracks {
	const userId = useSession((session) => session.user?.id);
	const [actionTrack, setActionTrack] = useState<AddQueueItemBody | null>(null);
	const canEdit = canEditPlaylist(userId, playlist);

	return {
		canEdit,
		isMoving: usePendingMovesState((state) => state.count > 0),
		currentUri: playback.playingUri,
		actionTrack,
		showActions: (track, anchor) => {
			menuAnchorActions.record(anchor);
			setActionTrack(toTrackInput(track));
		},
		closeActions: () => setActionTrack(null),
		addToQueue: (track) => void playback.addToQueue(toTrackInput(track)),
		explainUnavailable: () => showInfo("Ce titre n'est plus disponible sur SoundCloud"),
		deleteTrack: useTrackDelete(id, canEdit),
		reorder: useTrackReorder(id, playlist),
	};
}
