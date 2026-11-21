import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LoadingIndicator } from '@/shared/theme/components/LoadingIndicator';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { LoadingSize, LoadingVariant } from '@/shared/theme/types/loadingTypes';
import { Text } from '@/shared/theme/components/Text';

type LoadingSpinnerProps = {
	size?: LoadingSize;
	message?: string;
	fullScreen?: boolean;
	variant?: LoadingVariant;
};

export function LoadingSpinner({
	size = 'large',
	message,
	fullScreen = false,
	variant = 'logo',
}: LoadingSpinnerProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={[styles.container, fullScreen && styles.fullScreen]}>
			<LoadingIndicator size={size} variant={variant} />
			{message && <Text style={styles.message}>{message}</Text>}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			justifyContent: 'center',
			alignItems: 'center',
			padding: theme.spacing.lg,
		},
		fullScreen: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		message: {
			marginTop: theme.spacing.md,
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			fontFamily: theme.typography.families.medium,
		},
	});
	return styles;
}
