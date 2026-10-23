import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/theme/ThemeContext';
import { useActiveQueue, useQueueStore } from '@/features/queue/stores/queueStore';
import { afterItemIdForDrop } from '@/shared/utils/moveTarget';
import { toTrackInput } from '@/shared/utils/trackInput';
import { createModalStyles } from '@/features/queue/components/queueModal/components/presenters/queueModalStyles';
import type { QueueItem } from '@/features/queue/types';
import type { AddQueueItemBody } from '@/shared/types/playback';

export function useQueueModal() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const styles = React.useMemo(() => createModalStyles(theme, insets), [theme, insets]);

	const { items, currentItemId } = useActiveQueue();
	const playItem = useQueueStore(state => state.playItem);
	const removeItem = useQueueStore(state => state.removeItem);
	const moveItem = useQueueStore(state => state.moveItem);
	const [isMoving, setIsMoving] = React.useState(false);
	const [actionTrack, setActionTrack] = React.useState<AddQueueItemBody | null>(null);

	const showActions = React.useCallback((item: QueueItem) => {
		setActionTrack(toTrackInput(item.track));
	}, []);

	const closeActions = React.useCallback(() => {
		setActionTrack(null);
	}, []);

	const { current, upcoming } = React.useMemo(() => {
		const index = currentItemId === null ? -1 : items.findIndex(item => item.id === currentItemId);
		return {
			current: index === -1 ? null : items[index],
			upcoming: items.slice(index + 1),
		};
	}, [items, currentItemId]);

	const handlePlay = React.useCallback(
		(itemId: string) => {
			void playItem(itemId);
		},
		[playItem]
	);

	const handleReorder = React.useCallback(
		async (from: number, to: number) => {
			const afterItemId = afterItemIdForDrop(upcoming, from, to);
			if (afterItemId === undefined) return;
			setIsMoving(true);
			try {
				await moveItem(upcoming[from].id, afterItemId);
			} finally {
				setIsMoving(false);
			}
		},
		[upcoming, moveItem]
	);

	return {
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
	};
}
