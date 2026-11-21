import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { EmptyStateButton } from '@/shared/theme/components/EmptyStateButton';
import { EmptyStateIcon } from '@/shared/theme/components/EmptyStateIcon';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { EmptyStateAction } from '@/shared/theme/types/emptyStateTypes';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';

type EmptyStateProps = {
	message: string;
	icon?: PixelIconSource;
	action?: EmptyStateAction;
	compact?: boolean;
	style?: StyleProp<ViewStyle>;
};

export function EmptyState({ message, icon, action, compact = false, style }: EmptyStateProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={[styles.container, compact && styles.compact, style]}>
			{icon && <EmptyStateIcon icon={icon} compact={compact} />}
			<Text style={styles.message}>{message}</Text>
			{action && <EmptyStateButton action={action} />}
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
		message: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.textSecondary,
			textAlign: 'center',
			fontFamily: theme.typography.families.medium,
		},
	});
	return styles;
}
