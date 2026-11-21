import React from 'react';
import { View, StyleSheet } from 'react-native';
import { originalTheme } from '@/shared/theme/configs/originalThemeConfig';
import { ERROR_STACK_MAX_HEIGHT } from '@/shared/theme/configs/layoutConfig';
import { Text } from '@/shared/theme/components/Text';
import { FONT_FAMILIES } from '@/shared/theme/configs/fontsConfig';

type ErrorStackProps = {
	title: string;
	stack: string;
};

export function ErrorStack({ title, stack }: ErrorStackProps) {
	return (
		<View style={styles.stackContainer}>
			<Text style={styles.stackTitle}>{title}</Text>
			<Text style={styles.stack}>{stack}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	stackContainer: {
		width: '100%',
		maxHeight: ERROR_STACK_MAX_HEIGHT,
		marginBottom: originalTheme.spacing.md,
		padding: originalTheme.spacing.smd,
		backgroundColor: originalTheme.colors.surface,
		borderWidth: originalTheme.borders.thin,
		borderColor: originalTheme.colors.borderLight,
	},
	stackTitle: {
		fontSize: originalTheme.typography.sizes.md,
		fontFamily: FONT_FAMILIES.bold,
		color: originalTheme.colors.success,
		marginBottom: originalTheme.spacing.sm,
	},
	stack: {
		fontSize: originalTheme.typography.sizes.sm,
		color: originalTheme.colors.textSecondary,
		fontFamily: FONT_FAMILIES.mono,
	},
});
