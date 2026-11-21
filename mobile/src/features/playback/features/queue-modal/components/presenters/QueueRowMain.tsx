import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Artwork } from '@/shared/theme/components/Artwork';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { formatDuration } from '@/shared/formatting/formatters';
import { QueuePlayingIcon } from '@/features/playback/features/queue-modal/components/presenters/QueuePlayingIcon';
import { QueueTrackDetails } from '@/features/playback/features/queue-modal/components/presenters/QueueTrackDetails';
import type { QueueItem } from '@/features/playback/shared/player/types/queueTypes';
import type { QueueRowActions } from '@/features/playback/features/queue-modal/queueModalTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';

type QueueRowMainProps = {
	item: QueueItem;
	isCurrent: boolean;
	actions: QueueRowActions;
};

export function QueueRowMain({ item, isCurrent, actions }: QueueRowMainProps) {
	const { styles } = useThemedStyles(createStyles);
	const { track } = item;

	return (
		<Pressable
			onPress={() => actions.onPlay(item.id)}
			onLongPress={() => actions.onShowActions(item)}
			style={styles.rowMain}
			accessibilityRole="button"
			accessibilityLabel={`Lire ${track.title}`}
			accessibilityState={{ selected: isCurrent }}
			testID={`queue-item-${item.id}`}
		>
			<Artwork uri={track.albumArt} size={42} />
			<QueueTrackDetails title={track.title} artist={track.artist} isCurrent={isCurrent} />
			{isCurrent ? <QueuePlayingIcon /> : null}
			<Text style={styles.duration}>{formatDuration(track.durationMs)}</Text>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		rowMain: {
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.md,
		},
		duration: {
			fontSize: theme.typography.sizes.smd,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
