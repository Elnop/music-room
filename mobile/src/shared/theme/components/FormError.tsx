import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/lib/types';
import { Text } from '@/shared/theme/components/Text';

interface FormErrorProps {
	message: string;
}

export function FormError({ message }: FormErrorProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	if (!message) return null;

	return (
		<View style={styles.container}>
			<Text style={styles.text}>{message}</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	return StyleSheet.create({
		container: {
			...pixelFrame(theme),
			borderColor: theme.colors.error,
			backgroundColor: theme.colors.surface,
			padding: theme.spacing.sm,
			marginBottom: theme.spacing.md,
		},
		text: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.error,
			fontFamily: theme.typography.families.semibold,
		},
	});
}
