import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import { QueueSwipe } from '@components/common/QueueSwipe';
import { Artwork } from '@components/common/Artwork';
import { PreviewBadge } from '@components/track/PreviewBadge';
import { TrackActionsButton } from '@components/track/TrackActionsButton';
import { isPreviewOnly } from '@utils/soundcloudPreview';
import type { SoundCloudTrack } from '@/types/soundcloud.types';

interface AddableTrackRowProps {
	track: SoundCloudTrack;
	isAdded: boolean;
	onAdd: (track: SoundCloudTrack) => void;
	onAddToQueue: (track: SoundCloudTrack) => void;
	onShowActions: (track: SoundCloudTrack) => void;
}

const formatDuration = (ms: number) => {
	const minutes = Math.floor(ms / 60000);
	const seconds = Math.floor((ms % 60000) / 1000);
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * A search result with its « + » (#307). Memoized: adding one track redraws
 * that row only, so its check shows at once.
 */
export const AddableTrackRow = React.memo(function AddableTrackRow({
	track,
	isAdded,
	onAdd,
	onAddToQueue,
	onShowActions,
}: AddableTrackRowProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={styles.trackRow}>
			<QueueSwipe onAddToQueue={() => onAddToQueue(track)}>
				<TouchableOpacity
					style={styles.trackItem}
					// An added track keeps its long press: only the tap is a no-op.
					onPress={() => !isAdded && onAdd(track)}
					onLongPress={() => onShowActions(track)}
					activeOpacity={0.7}
				>
					<Artwork
						uri={track.artwork_url || track.user.avatar_url}
						size={52}
						style={styles.artwork}
					/>
					<View style={styles.trackInfo}>
						<Text style={styles.trackTitle} numberOfLines={1}>
							{track.title}
						</Text>
						<Text style={styles.trackArtist} numberOfLines={1}>
							{track.user.username}
						</Text>
						<View style={styles.trackMeta}>
							{isPreviewOnly(track) && <PreviewBadge />}
							<Text style={styles.trackDuration}>{formatDuration(track.duration)}</Text>
						</View>
					</View>
					<TrackActionsButton onPress={() => onShowActions(track)} />
					<View style={[styles.addButton, isAdded && styles.addedButton]}>
						<Ionicons
							name={isAdded ? 'checkmark' : 'add'}
							size={20}
							color="#FFFFFF"
							testID={`${isAdded ? 'added' : 'add'}-${track.id}`}
						/>
					</View>
				</TouchableOpacity>
			</QueueSwipe>
		</View>
	);
});

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		// Spacing outside the swipe, so the queue panel matches the row's height.
		trackRow: {
			marginBottom: theme.spacing.xs,
		},
		trackItem: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: theme.spacing.md,
			paddingVertical: theme.spacing.sm,
			// Opaque so the queue panel stays hidden behind the row until swiped.
			backgroundColor: theme.colors.background,
		},
		artwork: {
			borderRadius: 8,
			marginRight: theme.spacing.md,
		},
		trackInfo: {
			flex: 1,
			// Keeps a long title off the buttons (#307).
			marginRight: theme.spacing.sm,
		},
		trackMeta: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.xs,
		},
		trackTitle: {
			fontSize: 15,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
			marginBottom: 3,
		},
		trackArtist: {
			fontSize: 13,
			color: theme.colors.textSecondary,
			marginBottom: 2,
		},
		trackDuration: {
			fontSize: 12,
			color: theme.colors.textSecondary,
		},
		addButton: {
			backgroundColor: theme.colors.primary,
			width: 36,
			height: 36,
			borderRadius: 18,
			justifyContent: 'center',
			alignItems: 'center',
			marginLeft: theme.spacing.sm,
		},
		addedButton: {
			backgroundColor: theme.colors.success,
		},
	});
