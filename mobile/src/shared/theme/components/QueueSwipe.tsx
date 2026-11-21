import React from 'react';
import { Swipeable } from 'react-native-gesture-handler';
import { QueueSwipeAction } from '@/shared/theme/components/QueueSwipeAction';

type QueueSwipeProps = {
	children: React.ReactNode;
	onAddToQueue?: () => void;
	rightActions?: React.ReactNode;
};

function renderQueueAction() {
	return <QueueSwipeAction />;
}

export function QueueSwipe({ children, onAddToQueue, rightActions }: QueueSwipeProps) {
	function handleOpen(direction: 'left' | 'right', swipeable: Swipeable) {
		if (direction !== 'left') return;
		swipeable.close();
		onAddToQueue?.();
	}

	return (
		<Swipeable
			renderLeftActions={onAddToQueue ? renderQueueAction : undefined}
			renderRightActions={rightActions ? () => rightActions : undefined}
			onSwipeableOpen={handleOpen}
			overshootLeft={false}
			overshootRight={false}
			friction={2}
			enabled={Boolean(onAddToQueue) || Boolean(rightActions)}
		>
			{children}
		</Swipeable>
	);
}
