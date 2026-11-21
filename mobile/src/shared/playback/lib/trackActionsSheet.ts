import type React from 'react';
import type { AddQueueItemBody } from '@/shared/playback/lib/playback';

export type TrackActionsStart = 'actions' | 'playlists';

export interface TrackActionsSheetProps {
	track: AddQueueItemBody | null;
	onClose: () => void;
	start?: TrackActionsStart;
}

export type TrackActionsSheetComponent = React.ComponentType<TrackActionsSheetProps>;
