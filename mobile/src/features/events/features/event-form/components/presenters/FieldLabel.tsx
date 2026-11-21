import React from 'react';
import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Text } from '@/shared/theme/components/Text';

export function FieldLabel({ children }: { children: string }) {
	const { styles } = useThemedStyles(createStyles);
	return <Text style={styles.label}>{children}</Text>;
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		label: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
			marginBottom: theme.spacing.sm,
		},
	});
	return styles;
}
