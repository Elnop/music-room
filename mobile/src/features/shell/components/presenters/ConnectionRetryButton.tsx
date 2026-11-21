import React from 'react';
import { StyleSheet } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';

type ConnectionRetryButtonProps = {
	fill: string;
	ink: string;
	onRetry: () => void;
};

export function ConnectionRetryButton({ fill, ink, onRetry }: ConnectionRetryButtonProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<Pressable
			onPress={onRetry}
			accessibilityLabel="Réessayer"
			hitSlop={8}
			style={[styles.button, fillStyle(fill)]}
		>
			<Text style={[styles.buttonText, inkStyle(ink)]}>Réessayer</Text>
		</Pressable>
	);
}

function fillStyle(backgroundColor: string): ViewStyle {
	return { backgroundColor };
}

function inkStyle(color: string): TextStyle {
	return { color };
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		button: {
			marginLeft: theme.spacing.sm,
			paddingVertical: theme.spacing.xxs,
			paddingHorizontal: theme.spacing.sm,
			borderRadius: theme.borders.round,
		},
		buttonText: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.bold,
		},
	});
	return styles;
}
