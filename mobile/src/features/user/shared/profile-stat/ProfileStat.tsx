import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { displayText } from '@/shared/theme/lib/pixelFrame';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type ProfileStatProps = {
	value: number;
	label: string;
	variant: 'own' | 'visited';
};

export function ProfileStat({ value, label, variant }: ProfileStatProps) {
	const { styles } = useThemedStyles(createStyles);
	const { styles: valueStyles } = useThemedStyles(createValueStyles);
	const own = variant === 'own';

	return (
		<View style={[styles.statItem, own && styles.ownItem]}>
			<Text style={own ? valueStyles.ownValue : valueStyles.visitedValue}>{value}</Text>
			<Text style={[styles.statLabel, own ? styles.ownLabel : styles.visitedLabel]}>{label}</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		statItem: {
			alignItems: 'center',
		},
		ownItem: {
			paddingHorizontal: theme.spacing.lg,
		},
		statLabel: {
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.xxs,
		},
		ownLabel: {
			fontSize: theme.typography.sizes.sm,
		},
		visitedLabel: {
			fontSize: theme.typography.sizes.smd,
		},
	});
	return styles;
}

function createValueStyles(theme: Theme) {
	const valueStyles = StyleSheet.create({
		ownValue: {
			fontSize: theme.typography.sizes.lgxl,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
		visitedValue: {
			...displayText(theme, theme.typography.sizes.xl),
			color: theme.colors.text,
		},
	});
	return valueStyles;
}
