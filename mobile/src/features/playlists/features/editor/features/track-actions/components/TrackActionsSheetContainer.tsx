import React from 'react';
import { useTrackActions } from '@/features/playlists/features/editor/features/track-actions/hooks/useTrackActions';
import { TrackActionsView } from '@/features/playlists/features/editor/features/track-actions/components/presenters/TrackActionsView';
import { useMenuAnchor } from '@/features/playlists/features/editor/shared/action-sheet/hooks/useMenuAnchor';
import type { AddQueueItemBody } from '@/shared/playback/lib/playback';
import type { TrackActionsStart } from '@/shared/playback/lib/trackActionsSheet';

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
