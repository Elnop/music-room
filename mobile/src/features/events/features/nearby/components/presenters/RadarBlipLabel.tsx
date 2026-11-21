import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { RADAR_BLIP } from '@/features/events/features/nearby/configs/radarConfig';

type RadarBlipLabelProps = {
	name: string;
	proximity: string;
};

export function RadarBlipLabel({ name, proximity }: RadarBlipLabelProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.label}>
			<Text style={styles.name} numberOfLines={1}>
				{name}
			</Text>
			<Text style={styles.distance}>{proximity}</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		label: {
			...pixelFrame(theme),
			maxWidth: RADAR_BLIP.labelMaxWidth,
			backgroundColor: theme.colors.text,
			paddingVertical: theme.spacing.xs,
			paddingHorizontal: theme.spacing.sm,
		},
		name: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.textInverse,
		},
		distance: {
			fontSize: theme.typography.sizes.xs,
			fontFamily: theme.typography.families.mono,
			color: theme.colors.textInverse,
		},
	});
	return styles;
}
