import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';

interface EmptyStateProps {
	message: string;
	icon?: keyof typeof Ionicons.glyphMap;
	style?: StyleProp<ViewStyle>;
}

export function EmptyState({ message, icon, style }: EmptyStateProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={[styles.container, style]}>
			{icon && (
				<Ionicons name={icon} size={64} color={theme.colors.textSecondary} style={styles.icon} />
			)}
			<Text style={styles.message}>{message}</Text>
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
	});
