import React from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { Pressable } from '@/shared/components/ui/Pressable';
import { FullScreenSheet } from '@/shared/components/layout/FullScreenSheet';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { AppToast } from '@/shared/components/feedback/AppToast';
import { ReorderableList } from '@/shared/components/lists/ReorderableList';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { getTrackActionsSheet } from '@/shared/services/trackActionsBridge';
import { QueueItemRow } from './QueueItemRow';
import type { createModalStyles } from './queueModalStyles';
import type { Theme } from '@/shared/theme/types';
import type { QueueItem } from '@/features/queue/types';
import type { AddQueueItemBody } from '@/shared/types/playback';
import { Text } from '@/shared/components/ui/Text';

interface QueueModalViewProps {
	visible: boolean;
	onClose: () => void;
	theme: Theme;
	styles: ReturnType<typeof createModalStyles>;
	current: QueueItem | null;
	upcoming: QueueItem[];
	isMoving: boolean;
	actionTrack: AddQueueItemBody | null;
	onPlay: (itemId: string) => void;
	onRemove: (itemId: string) => Promise<boolean>;
	onReorder: (from: number, to: number) => Promise<void>;
	onShowActions: (item: QueueItem) => void;
	onCloseActions: () => void;
}

export function QueueModalView({
	visible,
	onClose,
	theme,
	styles,
	current,
	upcoming,
	isMoving,
	actionTrack,
	onPlay,
	onRemove,
	onReorder,
	onShowActions,
	onCloseActions,
}: QueueModalViewProps) {
	const TrackActionsSheetComponent = getTrackActionsSheet();
	const { isWide } = useBreakpoint();

	const header = current ? (
		<View>
			<Text style={styles.sectionLabel}>En cours de lecture</Text>
			<QueueItemRow
				item={current}
				isCurrent
				onPlay={onPlay}
				onRemove={onRemove}
				onShowActions={onShowActions}
			/>
			<Text style={styles.sectionLabel}>À suivre</Text>
		</View>
	) : null;

	const empty = current ? (
		<Text style={styles.nothingNext}>Rien à suivre</Text>
	) : (
		<EmptyState message="La file d'attente est vide" icon="queue" />
	);

	const content = (
		<GestureHandlerRootView style={styles.container}>
			<View style={styles.header}>
				<Pressable
					onPress={onClose}
					style={styles.closeButton}
					hitSlop={4}
					accessibilityRole="button"
					accessibilityLabel="Fermer la file d'attente"
				>
					<PixelIcon name={isWide ? 'close' : 'down'} size={24} color={theme.colors.text} />
				</Pressable>
				<Text style={styles.title}>File d&apos;attente</Text>
			</View>

			<ReorderableList<QueueItem>
				data={upcoming}
				keyExtractor={item => item.id}
				onReorder={onReorder}
				dragEnabled={!isMoving}
				ListHeaderComponent={header}
				ListEmptyComponent={empty}
				contentContainerStyle={styles.listContent}
				renderItem={({ item, drag, isActive }) => (
					<QueueItemRow
						item={item}
						onPlay={onPlay}
						onRemove={onRemove}
						onDragStart={isMoving ? undefined : drag}
						isDragActive={isActive}
						onShowActions={onShowActions}
					/>
				)}
			/>

			{TrackActionsSheetComponent &&
				React.createElement(TrackActionsSheetComponent, {
					track: actionTrack,
					onClose: onCloseActions,
				})}

			<AppToast />
		</GestureHandlerRootView>
	);

	return (
		<FullScreenSheet visible={visible} onClose={onClose}>
			{content}
		</FullScreenSheet>
	);
}
