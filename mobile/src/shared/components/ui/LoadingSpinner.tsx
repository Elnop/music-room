import React, { useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { EqualizerBars } from '@/shared/components/media/EqualizerBars';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { Text } from './Text';

interface LoadingSpinnerProps {
	size?: 'small' | 'large';
	message?: string;
	fullScreen?: boolean;
	/** 'logo' (default) bounces the pixel equalizer; 'spinner' is the platform's activity indicator. */
	variant?: 'logo' | 'spinner';
}

export function LoadingSpinner({
	size = 'large',
	message,
	fullScreen = false,
	variant = 'logo',
}: LoadingSpinnerProps) {
	const { theme } = useTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);

	if (variant === 'spinner') {
		return (
			<View style={[styles.container, fullScreen && styles.fullScreen]}>
				<ActivityIndicator
					size={size === 'small' ? 'small' : 'large'}
					color={theme.colors.primary}
				/>
				{message && <Text style={styles.message}>{message}</Text>}
			</View>
		);
	}

	return (
		<View style={[styles.container, fullScreen && styles.fullScreen]}>
			<EqualizerBars
				color={theme.colors.primary}
				bars={size === 'small' ? 3 : 5}
				barWidth={size === 'small' ? 3 : 9}
				height={size === 'small' ? 18 : 48}
			/>
			{message && <Text style={styles.message}>{message}</Text>}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
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
