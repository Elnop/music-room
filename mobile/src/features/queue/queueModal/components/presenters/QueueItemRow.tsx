import React from 'react';
import { View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { useSeparatorColor } from '@/shared/hooks/useSeparatorColor';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Artwork } from '@/shared/components/media/Artwork';
import { TrackActionsButton } from '@/shared/components/lists/TrackActionsButton';
import { QueueTrackDetails } from './QueueTrackDetails';
import { createRowStyles, formatDuration } from './queueModalStyles';
import type { QueueItem } from '@/features/queue/types';
import { Text } from '@/shared/components/ui/Text';

interface QueueItemRowProps {
	item: QueueItem;
	isCurrent?: boolean;
	onPlay: (itemId: string) => void;
	onRemove: (itemId: string) => Promise<boolean>;
	onDragStart?: () => void;
	isDragActive?: boolean;
	onShowActions?: (item: QueueItem) => void;
}

export function QueueItemRow({
	item,
	isCurrent = false,
	onPlay,
	onRemove,
	onDragStart,
	isDragActive = false,
	onShowActions,
}: QueueItemRowProps) {
	const { theme } = useTheme();
	const separator = useSeparatorColor();
	const styles = React.useMemo(() => createRowStyles(theme, separator), [theme, separator]);
	const swipeableRef = React.useRef<Swipeable>(null);
	const { track } = item;

	const handleRemove = async () => {
		const removed = await onRemove(item.id);
		if (!removed) swipeableRef.current?.close();
	};

	const renderRightActions = () => (
		<Pressable
			style={styles.deleteButton}
			onPress={handleRemove}
			accessibilityRole="button"
			accessibilityLabel={`Retirer ${track.title}`}
		>
			<Ionicons name="trash-outline" size={24} color={theme.colors.onColor} />
			<Text style={styles.deleteText}>Retirer</Text>
		</Pressable>
	);

	return (
		<Swipeable
			ref={swipeableRef}
			renderRightActions={renderRightActions}
			overshootRight={false}
			friction={2}
		>
			<View style={[styles.row, isCurrent && styles.rowCurrent, isDragActive && styles.rowActive]}>
				{/* The row's buttons sit beside its pressable area, never in it: the web nests no <button>. */}
				<Pressable
					onPress={() => onPlay(item.id)}
					onLongPress={onShowActions ? () => onShowActions(item) : undefined}
					style={styles.rowMain}
					accessibilityRole="button"
					accessibilityLabel={`Lire ${track.title}`}
					accessibilityState={{ selected: isCurrent }}
					testID={`queue-item-${item.id}`}
				>
					<Artwork uri={track.albumArt} size={50} style={styles.albumArt} />

					<QueueTrackDetails
						title={track.title}
						artist={track.artist}
						isCurrent={isCurrent}
						styles={styles}
					/>

					{isCurrent ? (
						<Ionicons
							name="volume-high"
							size={18}
							color={theme.colors.primary}
							style={styles.playingIcon}
							accessibilityLabel="En cours de lecture"
						/>
					) : null}

					<Text style={styles.duration}>{formatDuration(track.durationMs)}</Text>
				</Pressable>

				{onShowActions && <TrackActionsButton onPress={() => onShowActions(item)} />}

				{onDragStart && (
					<Pressable
						onPressIn={onDragStart}
						hitSlop={10}
						style={styles.dragHandle}
						accessibilityRole="button"
						accessibilityLabel="Réordonner"
					>
						<Ionicons name="reorder-three-outline" size={24} color={theme.colors.textSecondary} />
					</Pressable>
				)}
			</View>
		</Swipeable>
	);
}
