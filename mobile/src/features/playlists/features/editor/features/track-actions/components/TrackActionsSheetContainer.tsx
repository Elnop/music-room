import React from 'react';
import { useTrackActions } from '@/features/playlists/features/editor/features/track-actions/hooks/useTrackActions';
import { TrackActionsView } from '@/features/playlists/features/editor/features/track-actions/components/presenters/TrackActionsView';
import { useMenuAnchor } from '@/features/playlists/features/editor/shared/action-sheet/hooks/useMenuAnchor';
import type { TrackActionsSheetProps } from '@/shared/playback/lib/trackActionsSheet';
import type { PlaybackActions } from '@/shared/playback/lib/playbackActions';

type TrackActionsSheetContainerProps = TrackActionsSheetProps & {
	playback: PlaybackActions;
};

export function TrackActionsSheetContainer({
	track,
	onClose,
	start,
	playback,
}: TrackActionsSheetContainerProps) {
	const actions = useTrackActions(track, onClose, start, playback);
	const anchor = useMenuAnchor(actions.visible);
	return <TrackActionsView actions={actions} anchor={anchor} onClose={onClose} />;
}
