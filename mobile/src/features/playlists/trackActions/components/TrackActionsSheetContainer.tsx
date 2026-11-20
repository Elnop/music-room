import React from 'react';
import { useTrackActions } from '@/features/playlists/trackActions/hooks/useTrackActions';
import { TrackActionsView } from '@/features/playlists/trackActions/components/presenters/TrackActionsView';
import { useMenuAnchor } from '@/features/playlists/hooks/useMenuAnchor';
import type { AddQueueItemBody } from '@/shared/playback/lib/playback';
import type { TrackActionsStart } from '@/shared/playback/lib/trackActionsBridge';

interface TrackActionsSheetProps {
	/** Null hides the sheet. */
	track: AddQueueItemBody | null;
	onClose: () => void;
	start?: TrackActionsStart;
}

export function TrackActionsSheetContainer({ track, onClose, start }: TrackActionsSheetProps) {
	const actions = useTrackActions(track, onClose, start);
	const anchor = useMenuAnchor(actions.visible);
	return <TrackActionsView actions={actions} anchor={anchor} onClose={onClose} />;
}
