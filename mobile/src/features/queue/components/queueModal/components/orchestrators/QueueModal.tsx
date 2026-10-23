import React from 'react';
import { useQueueModal } from '@/features/queue/components/queueModal/hooks/useQueueModal';
import { QueueModalView } from '@/features/queue/components/queueModal/components/presenters/QueueModalView';

interface QueueModalProps {
	visible: boolean;
	onClose: () => void;
}

export function QueueModal({ visible, onClose }: QueueModalProps) {
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
