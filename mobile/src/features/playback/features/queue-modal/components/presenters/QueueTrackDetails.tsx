import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type QueueTrackDetailsProps = {
	title: string;
	artist: string;
	isCurrent: boolean;
};

export function QueueTrackDetails({ title, artist, isCurrent }: QueueTrackDetailsProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.trackInfo}>
			<Text style={[styles.trackTitle, isCurrent && styles.trackTitleCurrent]} numberOfLines={1}>
				{title}
			</Text>
			<Text style={styles.trackArtist} numberOfLines={1}>
				{artist}
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
			fontSize: theme.typography.sizes.mdl,
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
	});
	return styles;
}
