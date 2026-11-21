import React from 'react';
import { View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { QueueItemRow } from '@/features/playback/features/queue-modal/components/presenters/QueueItemRow';
import { useQueueModalStyles } from '@/features/playback/features/queue-modal/hooks/useQueueModalStyles';
import type { QueueItem } from '@/features/playback/shared/player/types/queueTypes';
import type { QueueRowActions } from '@/features/playback/features/queue-modal/queueModalTypes';

type QueueCurrentSectionProps = {
	current: QueueItem;
	rowActions: QueueRowActions;
};

export function QueueCurrentSection({ current, rowActions }: QueueCurrentSectionProps) {
	const styles = useQueueModalStyles();

	return (
		<View>
			<Text style={styles.sectionLabel}>En cours de lecture</Text>
			<QueueItemRow item={current} isCurrent actions={rowActions} />
			<Text style={styles.sectionLabel}>À suivre</Text>
		</View>
	);
}
