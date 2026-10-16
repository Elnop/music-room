import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { QueueSwipe } from '@/components/common/QueueSwipe';
import { TrackActionsButton } from '@/components/track/TrackActionsButton';
import type { Theme } from '@/themes/types';
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

	const artworkUrl = track.artwork_url || track.user.avatar_url || 'https://via.placeholder.com/50';

	return (
		<QueueSwipe onAddToQueue={() => onAddToQueue(track)}>
			<TouchableOpacity
				style={styles.container}
				onPress={() => onPlay(track)}
				onLongPress={() => onShowActions(track)}
				activeOpacity={0.6}
			>
				<Image source={{ uri: artworkUrl }} style={styles.artwork} />
				<View style={styles.info}>
					<Text style={styles.title} numberOfLines={1}>
						{track.title}
					</Text>
					<Text style={styles.artist} numberOfLines={1}>
						{track.user.username}
					</Text>
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
			width: 48,
			height: 48,
			borderRadius: 4,
			backgroundColor: theme.colors.surfaceAlt,
		},
		info: {
			flex: 1,
			marginLeft: theme.spacing.md,
		},
		title: {
			fontSize: theme.typography.sizes.md,
			fontWeight: theme.typography.weights.medium,
			color: theme.colors.text,
			marginBottom: 2,
		},
		artist: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
		duration: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginRight: theme.spacing.sm,
		},
	});
