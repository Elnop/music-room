import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import { useContextMenu } from '@/shared/hooks/useContextMenu';
import { Pressable } from '@/shared/components/ui/Pressable';
import { QueueSwipe } from '@/shared/components/lists/QueueSwipe';
import { Artwork } from '@/shared/components/media/Artwork';
import { PreviewBadge } from '@/shared/components/media/PreviewBadge';
import { isPreviewOnly } from '@/shared/utils/soundcloudPreview';
import { TrackActionsButton } from '@/shared/components/lists/TrackActionsButton';
import { formatDuration } from '@/shared/utils/formatters';
import { pixelRow } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';
import type { SoundCloudTrack } from '@/features/search/types';
import { Text } from '@/shared/components/ui/Text';

interface SoundCloudTrackItemProps {
	track: SoundCloudTrack;
	onPlay: (track: SoundCloudTrack) => void;
	/** A right swipe adds the track to the play queue. */
	onAddToQueue: (track: SoundCloudTrack) => void;
	/** A long press or the ⋯ button opens the track's quick actions. */
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
	const contextMenu = useContextMenu(() => onShowActions(track));

	return (
		<QueueSwipe onAddToQueue={() => onAddToQueue(track)}>
			<View style={styles.container} {...contextMenu}>
				{/* The row's buttons sit beside its pressable area, never in it: the web nests no <button>. */}
				<Pressable
					style={styles.pressable}
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
				</Pressable>
				<TrackActionsButton onPress={() => onShowActions(track)} />
			</View>
		</QueueSwipe>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: pixelRow(theme),
		pressable: {
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.md,
		},
		artwork: {
		},
		info: {
			flex: 1,
		},
		subtitle: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.xs,
		},
		title: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.medium,
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
