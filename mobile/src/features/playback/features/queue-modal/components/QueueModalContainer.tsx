import React from 'react';
import type { TrackActionsSheetComponent } from '@/shared/playback/lib/trackActionsSheet';
import { useQueueModal } from '@/features/playback/features/queue-modal/useQueueModal';
import { QueueModalView } from '@/features/playback/features/queue-modal/components/presenters/QueueModalView';

type QueueModalProps = {
	visible: boolean;
	onClose: () => void;
	TrackActionsSheet: TrackActionsSheetComponent;
};

export function QueueModalContainer({ visible, onClose, TrackActionsSheet }: QueueModalProps) {
	const {
		theme,
		styles,
		current,
		upcoming,
		isMoving,
		actionTrack,
		showActions,
		closeActions,
		handlePlay,
		handleReorder,
		removeItem,
	} = useQueueModal();

	return (
		<QueueModalView
			TrackActionsSheet={TrackActionsSheet}
			visible={visible}
			onClose={onClose}
			theme={theme}
			styles={styles}
			current={current}
			upcoming={upcoming}
			isMoving={isMoving}
			actionTrack={actionTrack}
			onPlay={handlePlay}
			onRemove={removeItem}
			onReorder={handleReorder}
			onShowActions={showActions}
			onCloseActions={closeActions}
		/>
	);
}
