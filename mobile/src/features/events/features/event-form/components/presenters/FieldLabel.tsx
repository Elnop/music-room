import React from 'react';
import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { Text } from '@/shared/components/ui/Text';

export function FieldLabel({ children }: { children: string }) {
	const { styles } = useThemedStyles(createStyles);
	return <Text style={styles.label}>{children}</Text>;
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		label: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
			marginBottom: theme.spacing.sm,
		},
	});
