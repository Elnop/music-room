import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';

type PlayerBarTrackTextProps = {
	nowPlaying: NowPlaying;
};

export function PlayerBarTrackText({ nowPlaying }: PlayerBarTrackTextProps) {
	const { styles } = useThemedStyles(createStyles);
	const { track, deviceLabel } = nowPlaying;

	return (
		<View style={styles.info}>
			<Text style={styles.title} numberOfLines={1}>
				{track ? track.title : 'Rien en lecture'}
			</Text>
			<Text style={styles.artist} numberOfLines={1}>
				{track ? track.artist : 'Choisissez un titre pour commencer'}
			</Text>
			{deviceLabel && (
				<Text style={styles.device} numberOfLines={1}>
					Sur {deviceLabel}
				</Text>
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		info: { flexShrink: 1, minWidth: 0 },
		title: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		artist: { fontSize: theme.typography.sizes.sm, color: theme.colors.textSecondary },
		device: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.primary,
		},
	});
	return styles;
}
