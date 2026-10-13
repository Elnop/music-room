import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { QueueSwipe } from '@/components/common/QueueSwipe';
import type { Theme } from '@/themes/types';
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
}

export function SwipeableTrackItem({
	track,
	onDelete,
	disabled = false,
	onAddToQueue,
	onDragStart,
	isDragActive = false,
}: SwipeableTrackItemProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const renderRightActions = () => (
		<TouchableOpacity
			style={styles.deleteButton}
			onPress={() => onDelete(track.id)}
			activeOpacity={0.7}
		>
			<Ionicons name="trash-outline" size={24} color="#FFFFFF" />
			<Text style={styles.deleteText}>Supprimer</Text>
		</TouchableOpacity>
	);

	return (
		<QueueSwipe
			onAddToQueue={onAddToQueue}
			renderRightActions={disabled ? undefined : renderRightActions}
		>
			<View style={[styles.trackContainer, isDragActive && styles.trackContainerActive]}>
				{track.albumArt ? (
					<Image source={{ uri: track.albumArt }} style={styles.albumArt} />
				) : (
					<View style={[styles.albumArt, styles.albumArtPlaceholder]}>
						<Ionicons name="musical-notes" size={24} color={theme.colors.textSecondary} />
					</View>
				)}

				<View style={styles.trackInfo}>
					<Text style={styles.trackTitle} numberOfLines={1}>
						{track.title}
					</Text>
					<Text style={styles.trackArtist} numberOfLines={1}>
						{track.artist}
					</Text>
				</View>

				{track.durationMs && (
					<Text style={styles.duration}>{formatDuration(track.durationMs)}</Text>
				)}

				{!disabled && onDragStart && (
					<Pressable
						onPressIn={onDragStart}
						hitSlop={10}
						style={styles.dragHandle}
						accessibilityRole="button"
						accessibilityLabel="Reorder track"
					>
						<Ionicons name="reorder-three-outline" size={24} color={theme.colors.textSecondary} />
					</Pressable>
				)}
			</View>
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
