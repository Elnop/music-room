import React from 'react';
import { QueueModalContainer } from '@/features/playback/features/queue-modal/components/QueueModalContainer';
import { TrackActionsSheet } from '@/app/TrackActionsSheet';

export function QueueSheet(props: { visible: boolean; onClose: () => void }) {
	return <QueueModalContainer {...props} TrackActionsSheet={TrackActionsSheet} />;
}
