import React from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { useSeparatorColor } from '@/shared/hooks/useSeparatorColor';
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
	/** A long press or the ⋯ button opens the track's quick actions. */
	onShowActions?: () => void;
	/** The track playing now from this playlist: highlighted like the queue's current item. */
	isCurrent?: boolean;
	/** A tap on the row; without it, the row only reacts to a long press. */
	onPress?: () => void;
	/** Shows a spinner while the tap's request runs. */
	isPending?: boolean;
	/** Greyed out, with no queue swipe nor quick actions; delete and drag still work. */
	unavailable?: boolean;
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
	onPress,
	isPending = false,
	unavailable = false,
}: SwipeableTrackItemProps) {
	const { theme } = useTheme();
	const separator = useSeparatorColor();
	const styles = React.useMemo(() => createStyles(theme, separator), [theme, separator]);
	const actions = unavailable ? undefined : onShowActions;

	const renderRightActions = () => (
		<Pressable
			style={styles.deleteButton}
			onPress={() => onDelete(track.id)}
			accessibilityLabel={`Supprimer ${track.title}`}
		>
			<Ionicons name="trash-outline" size={24} color={theme.colors.onColor} />
			<Text style={styles.deleteText}>Supprimer</Text>
		</Pressable>
	);

	return (
		<QueueSwipe
			onAddToQueue={unavailable ? undefined : onAddToQueue}
			renderRightActions={disabled ? undefined : renderRightActions}
		>
			<View
				style={[
					styles.trackContainer,
					isCurrent && styles.trackContainerCurrent,
					isDragActive && styles.trackContainerActive,
				]}
			>
				{/* The row's buttons sit beside its pressable area, never in it: the web nests no <button>. */}
				<Pressable
					onPress={onPress}
					onLongPress={actions}
					accessibilityLabel={`${track.title}, ${track.artist}${unavailable ? ', indisponible' : ''}`}
					accessibilityHint={actions ? 'Appui long pour les actions du titre' : undefined}
					accessibilityState={{ selected: isCurrent, busy: isPending, disabled: unavailable }}
					style={styles.trackPressable}
				>
					{track.albumArt ? (
						<Image
							source={{ uri: track.albumArt }}
							style={[styles.albumArt, unavailable && styles.unavailable]}
						/>
					) : (
						<View
							style={[
								styles.albumArt,
								styles.albumArtPlaceholder,
								unavailable && styles.unavailable,
							]}
						>
							<Ionicons name="musical-notes" size={24} color={theme.colors.textSecondary} />
						</View>
					)}

					<View style={[styles.trackInfo, unavailable && styles.unavailable]}>
						<Text
							style={[styles.trackTitle, isCurrent && styles.trackTitleCurrent]}
							numberOfLines={1}
						>
							{track.title}
						</Text>
						<Text style={styles.trackArtist} numberOfLines={1}>
							{unavailable ? `Indisponible · ${track.artist}` : track.artist}
						</Text>
					</View>

					{isPending && (
						<ActivityIndicator
							size="small"
							color={theme.colors.primary}
							style={styles.playingIcon}
							accessibilityLabel="Lancement"
						/>
					)}

					{isCurrent && !isPending && (
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
				</Pressable>

				{actions && <TrackActionsButton onPress={actions} />}

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
			</View>
		</QueueSwipe>
	);
}

const formatDuration = (ms: number): string => {
	const minutes = Math.floor(ms / 60000);
	const seconds = Math.floor((ms % 60000) / 1000);
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const createStyles = (theme: Theme, separator: string) =>
	StyleSheet.create({
		trackContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			padding: 12,
			backgroundColor: theme.colors.surface,
			borderBottomWidth: 1,
			borderBottomColor: separator,
		},
		trackPressable: {
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
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
		unavailable: {
			opacity: 0.4,
		},
		trackContainerActive: {
			elevation: 6,
			shadowColor: theme.colors.shadow,
			shadowOpacity: 0.25,
			shadowRadius: 6,
			shadowOffset: { width: 0, height: 3 },
		},
		dragHandle: {
			marginLeft: theme.spacing.sm,
			padding: theme.spacing.xs,
		},
		deleteButton: {
			backgroundColor: theme.colors.error,
			justifyContent: 'center',
			alignItems: 'center',
			width: 100,
			height: '100%',
		},
		deleteText: {
			color: theme.colors.onColor,
			fontSize: 12,
			fontWeight: '600',
			marginTop: 4,
		},
	});
