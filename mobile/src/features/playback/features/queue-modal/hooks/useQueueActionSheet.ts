import { useCallback, useState } from 'react';
import { toTrackInput } from '@/shared/tracks/lib/toTrackInput';
import { menuAnchorActions } from '@/shared/theme/menuAnchorStore';
import type { QueueItem } from '@/features/playback/shared/player/types/queueTypes';
import type { AddQueueItemBody } from '@/shared/playback/types/playbackTypes';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';

export function useQueueActionSheet() {
	const [track, setTrack] = useState<AddQueueItemBody | null>(null);

	const onShowActions = useCallback((item: QueueItem, anchor?: MenuAnchor) => {
		menuAnchorActions.record(anchor);
		setTrack(toTrackInput(item.track));
	}, []);

	const onClose = useCallback(() => {
		setTrack(null);
	}, []);

	return { track, onShowActions, onClose };
}
