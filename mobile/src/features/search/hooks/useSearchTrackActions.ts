import { useCallback, useState } from 'react';
import { toTrackInput } from '@/shared/tracks/lib/toTrackInput';
import type { PlaybackActions } from '@/shared/playback/types/playbackActionsTypes';
import type { AddQueueItemBody } from '@/shared/playback/types/playbackTypes';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import { menuAnchorActions } from '@/shared/theme/menuAnchorStore';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';
import { useSearchPlayback } from '@/features/search/hooks/useSearchPlayback';
import type { SearchTrackActions } from '@/features/search/searchTypes';

export function useSearchTrackActions(playback: PlaybackActions): SearchTrackActions {
	const playbackHandlers = useSearchPlayback(playback);
	const [actionTrack, setActionTrack] = useState<AddQueueItemBody | null>(null);

	const onShowActions = useCallback((track: SoundCloudTrack, anchor?: MenuAnchor) => {
		menuAnchorActions.record(anchor);
		setActionTrack(toTrackInput(track));
	}, []);

	const onClose = useCallback(() => {
		setActionTrack(null);
	}, []);

	return {
		trackHandlers: { ...playbackHandlers, onShowActions },
		actionSheet: { track: actionTrack, onClose },
	};
}
