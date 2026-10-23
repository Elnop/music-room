import React from 'react';
import { useTrackActions } from '@/features/playlists/trackActions/hooks/useTrackActions';
import { TrackActionsView } from '@/features/playlists/trackActions/components/presenters/TrackActionsView';
import type { AddQueueItemBody } from '@/shared/types/playback';

interface TrackActionsSheetProps {
	/** The track to act on (see `toTrackInput`); null hides the sheet. */
	track: AddQueueItemBody | null;
	onClose: () => void;
}

/** The same sheet on every track list; sharing opens the system share sheet, no toast. */
export function TrackActionsSheet({ track, onClose }: TrackActionsSheetProps) {
	const actions = useTrackActions(track, onClose);
	return <TrackActionsView actions={actions} onClose={onClose} />;
}
