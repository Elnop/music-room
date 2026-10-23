import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import { Pressable } from '@/shared/components/ui/Pressable';
import { QueueSwipe } from '@/shared/components/lists/QueueSwipe';
import { Artwork } from '@/shared/components/media/Artwork';
import { PreviewBadge } from '@/shared/components/media/PreviewBadge';
import { isPreviewOnly } from '@/shared/utils/soundcloudPreview';
import { TrackActionsButton } from '@/shared/components/lists/TrackActionsButton';
import { formatDuration } from '@/shared/utils/formatters';
import type { Theme } from '@/shared/theme/types';
import type { SoundCloudTrack } from '@/features/search/types';

interface SoundCloudTrackItemProps {
	track: SoundCloudTrack;
	onPlay: (track: SoundCloudTrack) => void;
	/** A right swipe adds the track to the play queue. */
	onAddToQueue: (track: SoundCloudTrack) => void;
	/** A long press or the ⋯ button opens the track's quick actions (#316). */
	onShowActions: (track: SoundCloudTrack) => void;
}

export function SoundCloudTrackItem({
	track,
	onPlay,
	onAddToQueue,
	onShowActions,
}: SoundCloudTrackItemProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const artworkUrl = track.artwork_url || track.user.avatar_url;

	return (
		<QueueSwipe onAddToQueue={() => onAddToQueue(track)}>
			<Pressable
				style={styles.container}
				onPress={() => onPlay(track)}
				onLongPress={() => onShowActions(track)}
				accessibilityRole="button"
				accessibilityLabel={`Écouter ${track.title} par ${track.user.username}`}
			>
				<Artwork uri={artworkUrl} size={48} style={styles.artwork} />
				<View style={styles.info}>
					<Text style={styles.title} numberOfLines={1}>
						{track.title}
					</Text>
					<View style={styles.subtitle}>
						{isPreviewOnly(track) && <PreviewBadge />}
						<Text style={styles.artist} numberOfLines={1}>
							{track.user.username}
						</Text>
					</View>
				</View>
				<Text style={styles.duration}>{formatDuration(track.duration)}</Text>
				<TrackActionsButton onPress={() => onShowActions(track)} />
			</Pressable>
		</QueueSwipe>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: 8,
			paddingHorizontal: theme.spacing.md,
			backgroundColor: theme.colors.background,
		},
		artwork: {
			borderRadius: 4,
		},
		info: {
			flex: 1,
			marginLeft: theme.spacing.md,
			marginRight: theme.spacing.sm,
		},
		subtitle: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.xs,
		},
		title: {
			fontSize: theme.typography.sizes.md,
			fontWeight: theme.typography.weights.medium,
			color: theme.colors.text,
			marginBottom: 2,
		},
		artist: {
			flexShrink: 1,
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
		duration: {
			flexShrink: 0,
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginRight: theme.spacing.sm,
		},
	});
