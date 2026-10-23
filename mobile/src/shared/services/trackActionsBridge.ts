import React from 'react';
import type { AddQueueItemBody } from '@/shared/types/playback';

interface TrackActionsSheetProps {
	track: AddQueueItemBody | null;
	onClose: () => void;
}

type TrackActionsSheetComponent = React.ComponentType<TrackActionsSheetProps>;

let sheetComponent: TrackActionsSheetComponent | null = null;

export function registerTrackActionsSheet(component: TrackActionsSheetComponent): void {
	sheetComponent = component;
}

export function getTrackActionsSheet(): TrackActionsSheetComponent | null {
	return sheetComponent;
}
