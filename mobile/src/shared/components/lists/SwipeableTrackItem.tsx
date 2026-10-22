import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { QueueSwipe } from './QueueSwipe';
import { TrackActionsButton } from './TrackActionsButton';
import type { Theme } from '@/shared/theme/types';
import type { Track } from '@/types/track.types';

interface SwipeableTrackItemProps {
	track: Track;
	onDelete: (trackId: string) => Promise<void>;
	/** True for a viewer who cannot edit: no delete swipe, no drag handle. */
	disabled?: boolean;
	/** A right swipe adds the track to the play queue, for any viewer. */
	onAddToQueue?: () => void;
	/** Shows the drag handle; pressing it starts a reorder drag. */
	onDragStart?: () => void;
	/** Raises the row while it is being dragged. */
	isDragActive?: boolean;
	/** A long press or the ⋯ button opens the track's quick actions (#316). */
	onShowActions?: () => void;
	/** The track playing now from this playlist: highlighted like the queue's current item. */
	isCurrent?: boolean;
}

export function SwipeableTrackItem({
	track,
	onDelete,
	disabled = false,
	onAddToQueue,
	onDragStart,
	isDragActive = false,
	onShowActions,
	isCurrent = false,
}: SwipeableTrackItemProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const renderRightActions = () => (
		<Pressable
			style={styles.deleteButton}
			onPress={() => onDelete(track.id)}
			accessibilityLabel={`Supprimer ${track.title}`}
		>
			<Ionicons name="trash-outline" size={24} color="#FFFFFF" />
			<Text style={styles.deleteText}>Supprimer</Text>
		</Pressable>
	);

	return (
		<QueueSwipe
			onAddToQueue={onAddToQueue}
			renderRightActions={disabled ? undefined : renderRightActions}
		>
			<Pressable
				onLongPress={onShowActions}
				accessibilityLabel={`${track.title}, ${track.artist}`}
				accessibilityHint={onShowActions ? 'Appui long pour les actions du titre' : undefined}
				accessibilityState={{ selected: isCurrent }}
				style={[
					styles.trackContainer,
					isCurrent && styles.trackContainerCurrent,
					isDragActive && styles.trackContainerActive,
				]}
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

				{track.durationMs && (
					<Text style={styles.duration}>{formatDuration(track.durationMs)}</Text>
				)}

				{onShowActions && <TrackActionsButton onPress={onShowActions} />}

				{!disabled && onDragStart && (
					<Pressable
						onPressIn={onDragStart}
						hitSlop={10}
						style={styles.dragHandle}
						accessibilityLabel="Réordonner"
					>
						<Ionicons name="reorder-three-outline" size={24} color={theme.colors.textSecondary} />
					</Pressable>
				)}
			</Pressable>
		</QueueSwipe>
	);
}

const formatDuration = (ms: number): string => {
	const minutes = Math.floor(ms / 60000);
	const seconds = Math.floor((ms % 60000) / 1000);
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		trackContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			padding: 12,
			backgroundColor: theme.colors.surface,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.border,
		},
		trackContainerCurrent: {
			backgroundColor: theme.colors.surfaceAlt,
			borderLeftWidth: 4,
			borderLeftColor: theme.colors.primary,
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
		playingIcon: {
			marginRight: 8,
		},
		trackArtist: {
			fontSize: 13,
			color: theme.colors.textSecondary,
		},
		duration: {
			fontSize: 13,
			color: theme.colors.textSecondary,
		},
		trackContainerActive: {
			elevation: 6,
			shadowColor: '#000000',
			shadowOpacity: 0.25,
			shadowRadius: 6,
			shadowOffset: { width: 0, height: 3 },
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
