import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useContextMenu } from '@/shared/theme/hooks/useContextMenu';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Pressable } from '@/shared/theme/components/Pressable';
import { QueueSwipe } from '@/shared/theme/components/QueueSwipe';
import { Artwork } from '@/shared/theme/components/Artwork';
import { TrackActionsButton } from '@/shared/theme/components/TrackActionsButton';
import { formatDuration } from '@/shared/formatting/formatters';
import { pixelRow } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import { Text } from '@/shared/theme/components/Text';
import { SoundCloudTrackInfo } from '@/features/search/components/presenters/SoundCloudTrackInfo';
import type { SearchTrackHandlers } from '@/features/search/searchTypes';

type SoundCloudTrackItemProps = SearchTrackHandlers & {
	track: SoundCloudTrack;
};

export function SoundCloudTrackItem({ track, ...handlers }: SoundCloudTrackItemProps) {
	const { styles } = useThemedStyles(createStyles);
	const contextMenu = useContextMenu(() => handlers.onShowActions(track));

	return (
		<QueueSwipe onAddToQueue={() => handlers.onAddToQueue(track)}>
			<View style={styles.container} {...contextMenu}>
				<Pressable
					style={styles.pressable}
					onPress={() => handlers.onPlay(track)}
					onLongPress={() => handlers.onShowActions(track)}
					accessibilityRole="button"
					accessibilityLabel={`Écouter ${track.title} par ${track.user.username}`}
				>
					<Artwork uri={track.artwork_url || track.user.avatar_url} size={48} />
					<SoundCloudTrackInfo track={track} />
					<Text style={styles.duration}>{formatDuration(track.duration)}</Text>
				</Pressable>
				<TrackActionsButton onPress={(anchor) => handlers.onShowActions(track, anchor)} />
			</View>
		</QueueSwipe>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: pixelRow(theme),
		pressable: {
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.md,
		},
		duration: {
			flexShrink: 0,
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginRight: theme.spacing.sm,
		},
	});
	return styles;
}
