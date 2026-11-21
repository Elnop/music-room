import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Artwork } from '@/shared/theme/components/Artwork';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { QueueItem } from '@/shared/playback/types/playbackTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { UP_NEXT_ARTWORK_SIZE } from '@/features/playback/features/now-playing-panel/nowPlayingPanelConfig';

type UpNextRowProps = {
	item: QueueItem;
	onPlay: (itemId: string) => void;
};

export function UpNextRow({ item, onPlay }: UpNextRowProps) {
	const { styles } = useThemedStyles(createStyles);
	const { track } = item;

	return (
		<Pressable
			style={styles.row}
			onPress={() => onPlay(item.id)}
			accessibilityLabel={`Lire ${track.title}, ${track.artist}`}
		>
			<Artwork uri={track.albumArt} size={UP_NEXT_ARTWORK_SIZE} />
			<View style={styles.rowText}>
				<Text style={styles.rowTitle} numberOfLines={1}>
					{track.title}
				</Text>
				<Text style={styles.caption} numberOfLines={1}>
					{track.artist}
				</Text>
			</View>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
		rowText: { flex: 1, minWidth: 0 },
		rowTitle: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		caption: { fontSize: theme.typography.sizes.sm, color: theme.colors.textSecondary },
	});
	return styles;
}
