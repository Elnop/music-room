import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, Animated, Easing, Image, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const AppLogo = require('@/assets/logo/app-icon.png');

interface LoadingSpinnerProps {
	size?: 'small' | 'large';
	message?: string;
	fullScreen?: boolean;
	/** Use 'spinner' for a simple ActivityIndicator, 'logo' (default) for animated app logo */
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

	// Animation values - created once and memoized
	const rotateAnim = useMemo(() => new Animated.Value(0), []);
	const scaleAnim = useMemo(() => new Animated.Value(1), []);

	// Calculate logo size based on prop
	const logoSize = size === 'small' ? 28 : 64;

	useEffect(() => {
		// Rotation animation - continuous spin
		const rotateAnimation = Animated.loop(
			Animated.timing(rotateAnim, {
				toValue: 1,
				duration: 2000,
				easing: Easing.linear,
				useNativeDriver: true,
			})
		);

		// Pulse animation - subtle scale up/down
		const pulseAnimation = Animated.loop(
			Animated.sequence([
				Animated.timing(scaleAnim, {
					toValue: 1.1,
					duration: 800,
					easing: Easing.inOut(Easing.ease),
					useNativeDriver: true,
				}),
				Animated.timing(scaleAnim, {
					toValue: 0.9,
					duration: 800,
					easing: Easing.inOut(Easing.ease),
					useNativeDriver: true,
				}),
			])
		);

		// Start both animations
		rotateAnimation.start();
		pulseAnimation.start();

		return () => {
			rotateAnimation.stop();
			pulseAnimation.stop();
		};
	}, [rotateAnim, scaleAnim]);

	// Interpolate rotation
	const spin = rotateAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ['0deg', '360deg'],
	});

	// Simple spinner variant
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

	// Logo variant (default)
	return (
		<View style={[styles.container, fullScreen && styles.fullScreen]}>
			<Animated.View
				style={{
					transform: [{ rotate: spin }, { scale: scaleAnim }],
				}}
			>
				<Image
					source={AppLogo}
					style={{ width: logoSize, height: logoSize }}
					resizeMode="contain"
				/>
			</Animated.View>
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
			fontWeight: theme.typography.weights.medium,
		},
	});
