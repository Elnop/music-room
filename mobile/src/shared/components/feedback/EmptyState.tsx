import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { Pressable } from '@/shared/components/ui/Pressable';

interface EmptyStateAction {
	label: string;
	onPress: () => void;
}

interface EmptyStateProps {
	message: string;
	icon?: keyof typeof Ionicons.glyphMap;
	/** A button under the message, leading out of the empty state. */
	action?: EmptyStateAction;
	style?: StyleProp<ViewStyle>;
}

export function EmptyState({ message, icon, action, style }: EmptyStateProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={[styles.container, style]}>
			{icon && (
				<Ionicons name={icon} size={64} color={theme.colors.textSecondary} style={styles.icon} />
			)}
			<Text style={styles.message}>{message}</Text>
			{action && (
				<Pressable style={styles.action} onPress={action.onPress} accessibilityLabel={action.label}>
					<Text style={styles.actionText}>{action.label}</Text>
				</Pressable>
			)}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			padding: theme.spacing.xl,
		},
		icon: {
			marginBottom: theme.spacing.md,
			opacity: 0.6,
		},
		message: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.textSecondary,
			textAlign: 'center',
			fontWeight: theme.typography.weights.medium,
		},
		action: {
			marginTop: theme.spacing.md,
			paddingVertical: theme.spacing.sm + 4,
			paddingHorizontal: theme.spacing.lg,
			borderRadius: 12,
			backgroundColor: theme.colors.primary,
		},
		actionText: {
			fontSize: theme.typography.sizes.lg,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.onColor,
		},
	});
