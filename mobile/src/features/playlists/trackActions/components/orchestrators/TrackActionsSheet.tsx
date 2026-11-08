import React from 'react';
import { useTrackActions } from '@/features/playlists/trackActions/hooks/useTrackActions';
import { TrackActionsView } from '@/features/playlists/trackActions/components/presenters/TrackActionsView';
import { useMenuAnchor } from '@/shared/hooks/useMenuAnchor';
import type { AddQueueItemBody } from '@/shared/types/playback';
import type { TrackActionsStart } from '@/shared/services/trackActionsBridge';

interface TrackActionsSheetProps {
	/** Null hides the sheet. */
	track: AddQueueItemBody | null;
	onClose: () => void;
	start?: TrackActionsStart;
}

export function TrackActionsSheet({ track, onClose, start }: TrackActionsSheetProps) {
	const actions = useTrackActions(track, onClose, start);
	const anchor = useMenuAnchor(actions.visible);
	return <TrackActionsView actions={actions} anchor={anchor} onClose={onClose} />;
}
