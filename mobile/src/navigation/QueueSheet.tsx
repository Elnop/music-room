import React from 'react';
import { QueueModalContainer } from '@/features/playback/features/queue-modal/components/QueueModalContainer';
import { TrackActionsSheetContainer } from '@/features/playlists/features/editor/features/track-actions/components/TrackActionsSheetContainer';

export function QueueSheet(props: { visible: boolean; onClose: () => void }) {
	return <QueueModalContainer {...props} TrackActionsSheet={TrackActionsSheetContainer} />;
}
