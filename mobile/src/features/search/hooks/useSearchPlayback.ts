import { useCallback } from 'react';
import { toTrackInput } from '@/shared/tracks/lib/toTrackInput';
import type { PlaybackActions } from '@/shared/playback/types/playbackActionsTypes';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import type { SearchPlaybackHandlers } from '@/features/search/searchTypes';

export function useSearchPlayback(playback: PlaybackActions): SearchPlaybackHandlers {
	const onPlay = useCallback(
		(track: SoundCloudTrack) => {
			void playback.playListTrack(track);
		},
		[playback]
	);

	const onAddToQueue = useCallback(
		(track: SoundCloudTrack) => {
			void playback.addToQueue(toTrackInput(track));
		},
		[playback]
	);

	return { onPlay, onAddToQueue };
}
