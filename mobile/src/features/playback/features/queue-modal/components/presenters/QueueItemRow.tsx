import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useContextMenu } from '@/shared/theme/hooks/useContextMenu';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { useSwipeRemove } from '@/features/playback/features/queue-modal/hooks/useSwipeRemove';
import { TrackActionsButton } from '@/shared/theme/components/TrackActionsButton';
import { pixelRow } from '@/shared/theme/lib/pixelFrame';
import { QueueRowMain } from '@/features/playback/features/queue-modal/components/presenters/QueueRowMain';
import { QueueRowDeleteAction } from '@/features/playback/features/queue-modal/components/presenters/QueueRowDeleteAction';
import { QueueDragHandle } from '@/features/playback/features/queue-modal/components/presenters/QueueDragHandle';
import type { QueueItem } from '@/features/playback/shared/player/types/queueTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type {
	QueueRowActions,
	QueueRowDrag,
} from '@/features/playback/features/queue-modal/queueModalTypes';

type QueueItemRowProps = {
	item: QueueItem;
	isCurrent?: boolean;
	actions: QueueRowActions;
	drag?: QueueRowDrag;
};

export function QueueItemRow({ item, isCurrent = false, actions, drag }: QueueItemRowProps) {
	const { styles } = useThemedStyles(createStyles);
	const { swipeableRef, handleRemove } = useSwipeRemove(() => actions.onRemove(item.id));
	const contextMenu = useContextMenu(() => actions.onShowActions(item));

	return (
		<Swipeable
			ref={swipeableRef}
			renderRightActions={() => (
				<QueueRowDeleteAction title={item.track.title} onRemove={handleRemove} />
			)}
			overshootRight={false}
			friction={2}
		>
			<View
				{...contextMenu}
				style={[styles.row, isCurrent && styles.rowCurrent, drag?.isDragActive && styles.rowActive]}
			>
				<QueueRowMain item={item} isCurrent={isCurrent} actions={actions} />
				<TrackActionsButton onPress={anchor => actions.onShowActions(item, anchor)} />
				{drag?.onDragStart && <QueueDragHandle onDragStart={drag.onDragStart} />}
			</View>
		</Swipeable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		row: pixelRow(theme),
		rowCurrent: {
			backgroundColor: theme.colors.surfaceAlt,
		},
		rowActive: {
			...theme.shadows.large,
		},
	});
	return styles;
}
