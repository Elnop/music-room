import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { displayText } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { NowPlayingTrack } from '@/features/playback/shared/player/types/playerTypes';

type PanelTrackTitleProps = {
	track: NowPlayingTrack;
};

export function PanelTrackTitle({ track }: PanelTrackTitleProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.titleBlock}>
			<Text style={styles.title} numberOfLines={2}>
				{track.title}
			</Text>
			<Text style={styles.artist} numberOfLines={1}>
				{track.artist}
			</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		titleBlock: { gap: theme.spacing.xs },
		title: {
			...displayText(theme, theme.typography.sizes.xxl),
			color: theme.colors.text,
		},
		artist: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.medium,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
