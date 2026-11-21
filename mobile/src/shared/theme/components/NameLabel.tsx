import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type NameLabelProps = {
	name: string;
	variant: 'row' | 'card';
};

export function NameLabel({ name, variant }: NameLabelProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<Text style={variant === 'card' ? styles.card : styles.row} numberOfLines={1}>
			{name}
		</Text>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		row: {
			flex: 1,
			fontSize: theme.typography.sizes.md,
			color: theme.colors.text,
		},
		card: {
			marginTop: theme.spacing.sm,
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
	});
	return styles;
}
