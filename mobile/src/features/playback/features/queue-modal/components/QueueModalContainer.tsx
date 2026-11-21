import React from 'react';
import type { TrackActionsSheetComponent } from '@/shared/playback/types/trackActionsSheetTypes';
import { useQueueModal } from '@/features/playback/features/queue-modal/hooks/useQueueModal';
import { QueueModalView } from '@/features/playback/features/queue-modal/components/presenters/QueueModalView';

type QueueModalContainerProps = {
	visible: boolean;
	onClose: () => void;
	TrackActionsSheet: TrackActionsSheetComponent;
};

export function QueueModalContainer({
	visible,
	onClose,
	TrackActionsSheet,
}: QueueModalContainerProps) {
	const { list, rowActions, actionSheet } = useQueueModal();

	return (
		<QueueModalView
			TrackActionsSheet={TrackActionsSheet}
			visible={visible}
			onClose={onClose}
			list={list}
			rowActions={rowActions}
			actionSheet={actionSheet}
		/>
	);
}
