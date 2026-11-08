import React from 'react';
import type { AddQueueItemBody } from '@/shared/types/playback';

export type TrackActionsStart = 'actions' | 'playlists';

interface TrackActionsSheetProps {
	track: AddQueueItemBody | null;
	onClose: () => void;
	start?: TrackActionsStart;
}

type TrackActionsSheetComponent = React.ComponentType<TrackActionsSheetProps>;

let sheetComponent: TrackActionsSheetComponent | null = null;

export function registerTrackActionsSheet(component: TrackActionsSheetComponent): void {
	sheetComponent = component;
}

export function getTrackActionsSheet(): TrackActionsSheetComponent | null {
	return sheetComponent;
}
