import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type TrackRowInfoProps = {
	track: { title: string; artist: string };
	state: { isCurrent: boolean; unavailable?: boolean };
};

export function TrackRowInfo({ track, state }: TrackRowInfoProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={[styles.trackInfo, state.unavailable && styles.unavailable]}>
			<Text
				style={[styles.trackTitle, state.isCurrent && styles.trackTitleCurrent]}
				numberOfLines={1}
			>
				{track.title}
			</Text>
			<Text style={styles.trackArtist} numberOfLines={1}>
				{state.unavailable ? `Indisponible · ${track.artist}` : track.artist}
			</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		trackInfo: {
			flex: 1,
		},
		trackTitle: {
			fontSize: theme.typography.sizes.mlg,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
			marginBottom: theme.spacing.xs,
		},
		trackTitleCurrent: {
			color: theme.colors.primary,
		},
		trackArtist: {
			fontSize: theme.typography.sizes.smd,
			color: theme.colors.textSecondary,
		},
		unavailable: {
			opacity: 0.4,
		},
	});
	return styles;
}
