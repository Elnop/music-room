import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Text } from '@/shared/theme/components/Text';

type ToggleCardTextProps = {
	label: string;
	description: string;
};

export function ToggleCardText({ label, description }: ToggleCardTextProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.info}>
			<Text style={styles.label}>{label}</Text>
			<Text style={styles.description}>{description}</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		info: {
			flex: 1,
			marginRight: theme.spacing.md,
		},
		label: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
			marginBottom: theme.spacing.xs,
		},
		description: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
