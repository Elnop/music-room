import React from 'react';
import { useTrackActions } from '@/features/playlists/trackActions/hooks/useTrackActions';
import { TrackActionsView } from '@/features/playlists/trackActions/components/presenters/TrackActionsView';
import type { AddQueueItemBody } from '@/shared/types/playback';

interface TrackActionsSheetProps {
	/** The track to act on (see `toTrackInput`); null hides the sheet. */
	track: AddQueueItemBody | null;
	onClose: () => void;
}

/**
 * Quick actions on a track (#316), the same sheet on every track list: play
 * next, add to the queue, add to a playlist I can edit, share the SoundCloud
 * link (the system share sheet, no toast).
 */
export function TrackActionsSheet({ track, onClose }: TrackActionsSheetProps) {
	const actions = useTrackActions(track, onClose);
	return <TrackActionsView actions={actions} onClose={onClose} />;
}
