import React from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { FullScreenSheet } from '@/features/playback/shared/full-screen-sheet/FullScreenSheet';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { AppToast } from '@/shared/theme/components/AppToast';
import { ReorderableList } from '@/shared/theme/components/ReorderableList';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import type { TrackActionsSheetComponent } from '@/shared/playback/lib/trackActionsSheet';
import { QueueItemRow } from '@/features/playback/features/queue-modal/components/presenters/QueueItemRow';
import type { createModalStyles } from '@/features/playback/features/queue-modal/components/presenters/queueModalStyles';
import type { Theme } from '@/shared/theme/lib/types';
import type { QueueItem } from '@/features/playback/shared/player/lib/queue.types';
import type { AddQueueItemBody } from '@/shared/playback/lib/playback';
import { Text } from '@/shared/theme/components/Text';
import ChevronDownSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/chevron-down-solid.svg';
import PlaylistSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/playlist-solid.svg';
import TimesSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/times-solid.svg';
import type { MenuAnchor } from '@/shared/theme/lib/menuPlacement';

interface QueueModalViewProps {
	TrackActionsSheet: TrackActionsSheetComponent;
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
	onShowActions: (item: QueueItem, anchor?: MenuAnchor) => void;
	onCloseActions: () => void;
}

export function QueueModalView({
	TrackActionsSheet,
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
		<EmptyState message="La file d'attente est vide" icon={PlaylistSolid} />
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
					<PixelIcon
						icon={isWide ? TimesSolid : ChevronDownSolid}
						size={24}
						color={theme.colors.text}
					/>
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

			<TrackActionsSheet track={actionTrack} onClose={onCloseActions} />

			<AppToast />
		</GestureHandlerRootView>
	);

	return (
		<FullScreenSheet visible={visible} onClose={onClose}>
			{content}
		</FullScreenSheet>
	);
}
