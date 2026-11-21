import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { displayText, keycap } from '@/shared/theme/lib/pixelFrame';
import type { EmptyStateAction } from '@/shared/theme/types/emptyStateTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';

type EmptyStateButtonProps = {
	action: EmptyStateAction;
};

export function EmptyStateButton({ action }: EmptyStateButtonProps) {
	const { styles } = useThemedStyles(createStyles);
	return (
		<Pressable style={styles.action} onPress={action.onPress} accessibilityLabel={action.label}>
			<Text style={styles.actionText}>{action.label}</Text>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		action: {
			...keycap(theme),
			marginTop: theme.spacing.md,
			paddingVertical: theme.spacing.sm + 4,
			paddingHorizontal: theme.spacing.lg,
			backgroundColor: theme.colors.primary,
		},
		actionText: {
			...displayText(theme, theme.typography.sizes.lg, 'button'),
			textTransform: 'uppercase',
			color: theme.colors.onColor,
		},
	});
	return styles;
}
