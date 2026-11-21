import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { PixelIconSource } from '@/shared/theme/components/PixelIcon';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { displayText, keycap } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/lib/types';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';

type EmptyStateAction = {
	label: string;
	onPress: () => void;
};

type EmptyStateProps = {
	message: string;
	icon?: PixelIconSource;
	action?: EmptyStateAction;
	compact?: boolean;
	style?: StyleProp<ViewStyle>;
};

export function EmptyState({ message, icon, action, compact = false, style }: EmptyStateProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={[styles.container, compact && styles.compact, style]}>
			{icon && (
				<PixelIcon
					icon={icon}
					size={compact ? 36 : 60}
					color={theme.colors.textSecondary}
					style={[styles.icon, compact && styles.compactIcon]}
				/>
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

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			padding: theme.spacing.xl,
		},
		compact: {
			flexGrow: 0,
			flexBasis: 'auto',
			paddingVertical: theme.spacing.lg,
		},
		compactIcon: {
			marginBottom: theme.spacing.sm,
		},
		icon: {
			marginBottom: theme.spacing.md,
			opacity: 0.6,
		},
		message: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.textSecondary,
			textAlign: 'center',
			fontFamily: theme.typography.families.medium,
		},
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
