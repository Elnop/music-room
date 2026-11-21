import type { PlaybackActions } from '@/shared/playback/types/playbackActionsTypes';
import type { AddQueueItemBody } from '@/shared/playback/types/playbackTypes';
import { useAddTrack } from '@/features/playlists/features/editor/shared/track-edits/useTrackEdits';
import {
	addToPlaylist,
	shareTrack,
} from '@/features/playlists/features/editor/features/track-actions/lib/trackTasks';
import type { TrackRunners } from '@/features/playlists/features/editor/features/track-actions/trackActionsTypes';

export function useTrackRunners(
	shown: AddQueueItemBody | null,
	onClose: () => void,
	playback: PlaybackActions
): TrackRunners {
	const addTrack = useAddTrack();

	function run(action: (body: AddQueueItemBody) => Promise<unknown>) {
		if (!shown) return;
		onClose();
		void action(shown);
	}

	return {
		playNext: () => run(body => playback.playNext(body)),
		addToQueue: () => run(body => playback.addToQueue(body)),
		addToPlaylist: playlist => run(body => addToPlaylist(addTrack.mutateAsync, playlist, body)),
		share: () => run(shareTrack),
	};
}
