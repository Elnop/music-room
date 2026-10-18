import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Pressable } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { TrackActionsButton } from '@/components/track/TrackActionsButton';
import type { Theme } from '@/themes/types';
import type { QueueItem } from '@/types/queue.types';

interface QueueItemRowProps {
	item: QueueItem;
	/** The item the queue is on: highlighted, never draggable. */
	isCurrent?: boolean;
	onPlay: (itemId: string) => void;
	/** Resolves true once the item is removed; the row closes its swipe otherwise. */
	onRemove: (itemId: string) => Promise<boolean>;
	/** Shows the drag handle; pressing it starts a reorder drag. */
	onDragStart?: () => void;
	/** Raises the row while it is being dragged. */
	isDragActive?: boolean;
	/** A long press or the ⋯ button opens the track's quick actions (#316). */
	onShowActions?: (item: QueueItem) => void;
}

/**
 * A queue row: tap to play, swipe left to remove, drag the handle to reorder,
 * long-press or ⋯ for the track's quick actions.
 */
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
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const swipeableRef = React.useRef<Swipeable>(null);
	const { track } = item;

	const handleRemove = async () => {
		const removed = await onRemove(item.id);
		if (!removed) swipeableRef.current?.close();
	};

	const renderRightActions = () => (
		<TouchableOpacity
			style={styles.deleteButton}
			onPress={handleRemove}
			activeOpacity={0.7}
			accessibilityRole="button"
			accessibilityLabel={`Retirer ${track.title}`}
		>
			<Ionicons name="trash-outline" size={24} color="#FFFFFF" />
			<Text style={styles.deleteText}>Retirer</Text>
		</TouchableOpacity>
	);

	return (
		<Swipeable
			ref={swipeableRef}
			renderRightActions={renderRightActions}
			overshootRight={false}
			friction={2}
		>
			<Pressable
				onPress={() => onPlay(item.id)}
				onLongPress={onShowActions ? () => onShowActions(item) : undefined}
				style={[styles.row, isCurrent && styles.rowCurrent, isDragActive && styles.rowActive]}
				accessibilityRole="button"
				accessibilityLabel={`Lire ${track.title}`}
				accessibilityState={{ selected: isCurrent }}
				testID={`queue-item-${item.id}`}
			>
				{track.albumArt ? (
					<Image source={{ uri: track.albumArt }} style={styles.albumArt} />
				) : (
					<View style={[styles.albumArt, styles.albumArtPlaceholder]}>
						<Ionicons name="musical-notes" size={24} color={theme.colors.textSecondary} />
					</View>
				)}

				<View style={styles.trackInfo}>
					<Text
						style={[styles.trackTitle, isCurrent && styles.trackTitleCurrent]}
						numberOfLines={1}
					>
						{track.title}
					</Text>
					<Text style={styles.trackArtist} numberOfLines={1}>
						{track.artist}
					</Text>
				</View>

				{isCurrent && (
					<Ionicons
						name="volume-high"
						size={18}
						color={theme.colors.primary}
						style={styles.playingIcon}
						accessibilityLabel="En cours de lecture"
					/>
				)}

				<Text style={styles.duration}>{formatDuration(track.durationMs)}</Text>

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
			</Pressable>
		</Swipeable>
	);
}

const formatDuration = (ms: number): string => {
	const minutes = Math.floor(ms / 60000);
	const seconds = Math.floor((ms % 60000) / 1000);
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			padding: 12,
			backgroundColor: theme.colors.surface,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.border,
		},
		rowCurrent: {
			backgroundColor: theme.colors.surfaceAlt,
			borderLeftWidth: 4,
			borderLeftColor: theme.colors.primary,
		},
		rowActive: {
			elevation: 6,
			shadowColor: '#000000',
			shadowOpacity: 0.25,
			shadowRadius: 6,
			shadowOffset: { width: 0, height: 3 },
		},
		albumArt: {
			width: 50,
			height: 50,
			borderRadius: 4,
			marginRight: 12,
		},
		albumArtPlaceholder: {
			backgroundColor: theme.colors.border,
			justifyContent: 'center',
			alignItems: 'center',
		},
		trackInfo: {
			flex: 1,
			marginRight: 8,
		},
		trackTitle: {
			fontSize: 15,
			fontWeight: '600',
			color: theme.colors.text,
			marginBottom: 4,
		},
		trackTitleCurrent: {
			color: theme.colors.primary,
		},
		trackArtist: {
			fontSize: 13,
			color: theme.colors.textSecondary,
		},
		playingIcon: {
			marginRight: 8,
		},
		duration: {
			fontSize: 13,
			color: theme.colors.textSecondary,
		},
		dragHandle: {
			marginLeft: theme.spacing.sm,
			padding: theme.spacing.xs,
		},
		deleteButton: {
			backgroundColor: '#FF6B6B',
			justifyContent: 'center',
			alignItems: 'center',
			width: 100,
			height: '100%',
		},
		deleteText: {
			color: '#FFFFFF',
			fontSize: 12,
			fontWeight: '600',
			marginTop: 4,
		},
	});
