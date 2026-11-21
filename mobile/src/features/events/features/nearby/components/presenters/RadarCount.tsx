import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Text } from '@/shared/theme/components/Text';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import WifiSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/wifi-solid.svg';

type RadarCountProps = {
	count: number;
};

export function RadarCount({ count }: RadarCountProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={styles.count}>
			<PixelIcon icon={WifiSolid} size={12} color={theme.colors.primary} />
			<Text style={styles.text}>{count}</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		count: {
			position: 'absolute',
			left: theme.spacing.sm,
			bottom: theme.spacing.sm,
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.xs,
		},
		text: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.mono,
			color: theme.colors.primary,
		},
	});
	return styles;
}
