import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { useContextMenu } from '@/shared/theme/hooks/useContextMenu';
import { Pressable } from '@/shared/theme/components/Pressable';
import { QueueSwipe } from '@/shared/theme/components/QueueSwipe';
import { Artwork } from '@/shared/theme/components/Artwork';
import { PreviewBadge } from '@/shared/theme/components/PreviewBadge';
import { isPreviewOnly } from '@/shared/tracks/lib/soundcloudPreview';
import { TrackActionsButton } from '@/shared/theme/components/TrackActionsButton';
import { formatDuration } from '@/shared/formatting/formatters';
import { pixelRow } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/lib/types';
import type { SoundCloudTrack } from '@/features/search/lib/types';
import { Text } from '@/shared/theme/components/Text';
import type { MenuAnchor } from '@/shared/theme/lib/menuPlacement';

interface SoundCloudTrackItemProps {
	track: SoundCloudTrack;
	onPlay: (track: SoundCloudTrack) => void;
	onAddToQueue: (track: SoundCloudTrack) => void;
	onShowActions: (track: SoundCloudTrack, anchor?: MenuAnchor) => void;
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
				<TrackActionsButton onPress={anchor => onShowActions(track, anchor)} />
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
		artwork: {},
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
