import type { PlaybackActions } from '@/shared/playback/types/playbackActionsTypes';
import type { AddQueueItemBody } from '@/shared/playback/types/playbackTypes';
import type { TrackActionsStart } from '@/shared/playback/types/trackActionsSheetTypes';
import { useNewPlaylistFromTrack } from '@/features/playlists/features/editor/features/track-actions/hooks/useNewPlaylistFromTrack';
import { useActionFlow } from '@/features/playlists/features/editor/features/track-actions/hooks/useActionFlow';
import { useEditablePlaylists } from '@/features/playlists/features/editor/features/track-actions/hooks/useEditablePlaylists';
import { useTrackRunners } from '@/features/playlists/features/editor/features/track-actions/hooks/useTrackRunners';
import type { TrackActions } from '@/features/playlists/features/editor/features/track-actions/trackActionsTypes';

export function useTrackActions(
	track: AddQueueItemBody | null,
	onClose: () => void,
	start: TrackActionsStart = 'actions',
	playback: PlaybackActions
): TrackActions {
	const { goTo, ...flow } = useActionFlow(track, start);
	const newPlaylist = useNewPlaylistFromTrack(flow.shown, onClose);

	return {
		...flow,
		...useEditablePlaylists(flow.step === 'playlists'),
		...useTrackRunners(flow.shown, onClose, playback),
		visible: track !== null,
		newPlaylist,
		openNewPlaylist: () => {
			newPlaylist.start();
			goTo('newPlaylist');
		},
	};
}
