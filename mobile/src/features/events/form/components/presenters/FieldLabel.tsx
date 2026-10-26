import React from 'react';
import { StyleSheet, Text } from 'react-native';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

export function FieldLabel({ children }: { children: string }) {
	const { styles } = useThemedStyles(createStyles);
	return <Text style={styles.label}>{children}</Text>;
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		label: {
			fontSize: theme.typography.sizes.md,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
			marginBottom: theme.spacing.sm,
		},
	});
