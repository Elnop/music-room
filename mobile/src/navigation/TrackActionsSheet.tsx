import React from 'react';
import { TrackActionsSheetContainer } from '@/features/playlists/features/editor/features/track-actions/components/TrackActionsSheetContainer';
import { playbackActions } from '@/features/playback/lib/playbackActions';
import type { TrackActionsSheetProps } from '@/shared/playback/lib/trackActionsSheet';

export function TrackActionsSheet(props: TrackActionsSheetProps) {
	return <TrackActionsSheetContainer {...props} playback={playbackActions} />;
}
