import React from 'react';
import { ReorderableList } from '@/shared/theme/components/ReorderableList';
import { QueueListEmpty } from '@/features/playback/features/queue-modal/components/presenters/QueueListEmpty';
import { QueueItemRow } from '@/features/playback/features/queue-modal/components/presenters/QueueItemRow';
import { QueueCurrentSection } from '@/features/playback/features/queue-modal/components/presenters/QueueCurrentSection';
import { useQueueModalStyles } from '@/features/playback/features/queue-modal/hooks/useQueueModalStyles';
import type { QueueItem } from '@/features/playback/shared/player/types/queueTypes';
import type {
	QueueListState,
	QueueRowActions,
} from '@/features/playback/features/queue-modal/queueModalTypes';

type QueueListProps = {
	list: QueueListState;
	rowActions: QueueRowActions;
};

export function QueueList({ list, rowActions }: QueueListProps) {
	const styles = useQueueModalStyles();
	const { current, isMoving } = list;
	const header = current ? <QueueCurrentSection current={current} rowActions={rowActions} /> : null;

	return (
		<ReorderableList<QueueItem>
			data={list.upcoming}
			keyExtractor={(item) => item.id}
			onReorder={list.onReorder}
			dragEnabled={!isMoving}
			ListHeaderComponent={header}
			ListEmptyComponent={<QueueListEmpty hasCurrent={current !== null} />}
			contentContainerStyle={styles.listContent}
			renderItem={({ item, drag, isActive }) => (
				<QueueItemRow
					item={item}
					actions={rowActions}
					drag={{ onDragStart: isMoving ? undefined : drag, isDragActive: isActive }}
				/>
			)}
		/>
	);
}
