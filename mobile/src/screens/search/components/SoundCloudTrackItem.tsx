import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import { QueueSwipe } from '@/shared/components/lists/QueueSwipe';
import { Artwork } from '@/shared/components/media/Artwork';
import { PreviewBadge } from '@/components/track/PreviewBadge';
import { isPreviewOnly } from '@/shared/utils/soundcloudPreview';
import { TrackActionsButton } from '@/components/track/TrackActionsButton';
import type { Theme } from '@/shared/theme/types';
import type { SoundCloudTrack } from '@/types/soundcloud.types';

interface Props {
	track: SoundCloudTrack;
	onPlay: (track: SoundCloudTrack) => void;
	/** A right swipe adds the track to the play queue. */
	onAddToQueue: (track: SoundCloudTrack) => void;
	/** A long press or the ⋯ button opens the track's quick actions (#316). */
	onShowActions: (track: SoundCloudTrack) => void;
}

export function SoundCloudTrackItem({ track, onPlay, onAddToQueue, onShowActions }: Props) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const formatDuration = (ms: number) => {
		const minutes = Math.floor(ms / 60000);
		const seconds = Math.floor((ms % 60000) / 1000);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	};

	const artworkUrl = track.artwork_url || track.user.avatar_url;

	return (
		<QueueSwipe onAddToQueue={() => onAddToQueue(track)}>
			<TouchableOpacity
				style={styles.container}
				onPress={() => onPlay(track)}
				onLongPress={() => onShowActions(track)}
				activeOpacity={0.6}
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
			</TouchableOpacity>
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
			// Opaque so the queue panel stays hidden behind the row until swiped.
			backgroundColor: theme.colors.background,
		},
		artwork: {
			borderRadius: 4,
		},
		info: {
			flex: 1,
			marginLeft: theme.spacing.md,
			// Keeps a long title off the duration (#307).
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
