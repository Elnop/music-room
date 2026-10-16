import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@/themes/types';
import { useActiveQueue, useQueueStore } from '@/store/queueStore';
import { afterItemIdForDrop } from '@/store/moveTarget';
import { ReorderableList } from '@/components/common/ReorderableList';
import { EmptyState } from '@/components/common/EmptyState';
import { QueueItemRow } from '@/components/player/QueueItemRow';
import { TrackActionsSheet } from '@/components/track/TrackActionsSheet';
import { toTrackInput } from '@/utils/trackInput';
import type { AddQueueItemBody, QueueItem } from '@/types/queue.types';

interface QueueModalProps {
	visible: boolean;
	onClose: () => void;
}

/**
 * The play queue over the player (#276): the current item, then the upcoming
 * items, which can be reordered. Any item can be tapped to play or swiped
 * away. History items are not listed. Every change goes to the server and
 * the list renders the store, so other devices' changes show up too.
 */
export function QueueModal({ visible, onClose }: QueueModalProps) {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const styles = React.useMemo(() => createStyles(theme, insets), [theme, insets]);

	// The queue of the active device's owner: a friend's in remote mode on their device (#297).
	const { items, currentItemId } = useActiveQueue();
	const playItem = useQueueStore(state => state.playItem);
	const removeItem = useQueueStore(state => state.removeItem);
	const moveItem = useQueueStore(state => state.moveItem);
	const [isMoving, setIsMoving] = React.useState(false);
	const [actionTrack, setActionTrack] = React.useState<AddQueueItemBody | null>(null);
	const showActions = (item: QueueItem) => setActionTrack(toTrackInput(item.track));

	// Stable per store state: the list keeps a dropped order only while `upcoming` is unchanged.
	const { current, upcoming } = React.useMemo(() => {
		const index = currentItemId === null ? -1 : items.findIndex(item => item.id === currentItemId);
		return {
			current: index === -1 ? null : items[index],
			upcoming: items.slice(index + 1),
		};
	}, [items, currentItemId]);

	const handlePlay = (itemId: string) => {
		void playItem(itemId);
	};

	const handleReorder = async (from: number, to: number) => {
		const afterItemId = afterItemIdForDrop(upcoming, from, to);
		if (afterItemId === undefined) return;
		setIsMoving(true);
		try {
			await moveItem(upcoming[from].id, afterItemId);
		} finally {
			setIsMoving(false);
		}
	};

	const header = current ? (
		<View>
			<Text style={styles.sectionLabel}>En cours de lecture</Text>
			<QueueItemRow
				item={current}
				isCurrent
				onPlay={handlePlay}
				onRemove={removeItem}
				onShowActions={showActions}
			/>
			<Text style={styles.sectionLabel}>À suivre</Text>
		</View>
	) : null;

	const empty = current ? (
		<Text style={styles.nothingNext}>Rien à suivre</Text>
	) : (
		<EmptyState message="La file d'attente est vide" icon="list-outline" />
	);

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="overFullScreen"
			transparent
			onRequestClose={onClose}
		>
			<GestureHandlerRootView style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity
						onPress={onClose}
						style={styles.closeButton}
						activeOpacity={0.7}
						accessibilityLabel="Fermer la file d'attente"
					>
						<Ionicons name="chevron-down" size={24} color={theme.colors.text} />
					</TouchableOpacity>
					<Text style={styles.title}>File d&apos;attente</Text>
				</View>

				<ReorderableList<QueueItem>
					data={upcoming}
					keyExtractor={item => item.id}
					onReorder={handleReorder}
					dragEnabled={!isMoving}
					ListHeaderComponent={header}
					ListEmptyComponent={empty}
					contentContainerStyle={styles.listContent}
					renderItem={({ item, drag, isActive }) => (
						<QueueItemRow
							item={item}
							onPlay={handlePlay}
							onRemove={removeItem}
							onDragStart={isMoving ? undefined : drag}
							isDragActive={isActive}
							onShowActions={showActions}
						/>
					)}
				/>

				<TrackActionsSheet track={actionTrack} onClose={() => setActionTrack(null)} />

				{/* The app root's toast sits behind native modals: queue errors show here. */}
				<Toast />
			</GestureHandlerRootView>
		</Modal>
	);
}

const createStyles = (theme: Theme, insets: { top: number; bottom: number }) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
			paddingTop: insets.top,
		},
		header: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: 16,
			paddingVertical: 12,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.border,
		},
		closeButton: {
			width: 40,
			height: 40,
			borderRadius: 20,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: theme.colors.surface,
		},
		title: {
			flex: 1,
			marginRight: 40,
			textAlign: 'center',
			fontSize: 18,
			fontWeight: '700',
			color: theme.colors.text,
		},
		listContent: {
			flexGrow: 1,
			paddingBottom: insets.bottom + 16,
		},
		sectionLabel: {
			paddingHorizontal: 16,
			paddingTop: 16,
			paddingBottom: 8,
			fontSize: 12,
			fontWeight: '600',
			letterSpacing: 1,
			textTransform: 'uppercase',
			color: theme.colors.textSecondary,
		},
		nothingNext: {
			padding: 16,
			textAlign: 'center',
			color: theme.colors.textSecondary,
		},
	});
