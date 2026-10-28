import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import type { PixelSpriteName } from '@/shared/constants/pixelSprites';
import { useTheme } from '@/shared/theme/ThemeContext';
import { keycap } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Text } from '@/shared/components/ui/Text';

interface EmptyStateAction {
	label: string;
	onPress: () => void;
}

interface EmptyStateProps {
	message: string;
	icon?: PixelSpriteName;
	/** A button under the message, leading out of the empty state. */
	action?: EmptyStateAction;
	/** A section's empty state among others (wide screens): it keeps to its content's height. */
	compact?: boolean;
	style?: StyleProp<ViewStyle>;
}

export function EmptyState({ message, icon, action, compact = false, style }: EmptyStateProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<View style={[styles.container, compact && styles.compact, style]}>
			{icon && (
				<PixelIcon
					name={icon}
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

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			padding: theme.spacing.xl,
		},
		// Longhands: on the web `flex: 0` also sets a zero basis, and the content would overflow.
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
			fontSize: theme.typography.sizes.lg,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.onColor,
		},
	});
