import React from 'react';
import { useTrackActions } from '@/features/playlists/trackActions/hooks/useTrackActions';
import { TrackActionsView } from '@/features/playlists/trackActions/components/presenters/TrackActionsView';
import { useMenuAnchor } from '@/shared/hooks/useMenuAnchor';
import type { AddQueueItemBody } from '@/shared/types/playback';
import type { TrackActionsStart } from '@/shared/services/trackActionsBridge';

interface TrackActionsSheetProps {
	/** The track to act on (see `toTrackInput`); null hides the sheet. */
	track: AddQueueItemBody | null;
	onClose: () => void;
	start?: TrackActionsStart;
}

/** The same sheet on every track list; sharing opens the system share sheet, no toast. */
export function TrackActionsSheet({ track, onClose, start }: TrackActionsSheetProps) {
	const actions = useTrackActions(track, onClose, start);
	const anchor = useMenuAnchor(actions.visible);
	return <TrackActionsView actions={actions} anchor={anchor} onClose={onClose} />;
}
