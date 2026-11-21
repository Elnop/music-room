import { useCallback, useState } from 'react';
import type { PlaybackActions } from '@/shared/playback/types/playbackActionsTypes';
import type { AddQueueItemBody } from '@/shared/playback/types/playbackTypes';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import { toTrackInput } from '@/shared/tracks/lib/toTrackInput';
import { menuAnchorActions } from '@/shared/theme/menuAnchorStore';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';
import type { ResultActions } from '@/features/playlists/features/editor/features/search-tracks/searchTracksTypes';

export function useResultActions(playback: PlaybackActions): ResultActions {
	const [actionTrack, setActionTrack] = useState<AddQueueItemBody | null>(null);

	return {
		addToQueue: useCallback(
			(track: SoundCloudTrack) => {
				void playback.addToQueue(toTrackInput(track));
			},
			[playback]
		),
		actionTrack,
		showActions: useCallback((track: SoundCloudTrack, anchor?: MenuAnchor) => {
			menuAnchorActions.record(anchor);
			setActionTrack(toTrackInput(track));
		}, []),
		closeActions: () => setActionTrack(null),
	};
}
