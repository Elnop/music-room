import React, { useEffect, useMemo, useState } from 'react';
import {
	AccessibilityInfo,
	Animated,
	Easing,
	type DimensionValue,
	type StyleProp,
	type ViewStyle,
} from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';

/**
 * Whether the OS asks to reduce motion; follows the setting while mounted.
 * `null` until the first answer, so nothing moves before it is known.
 */
function useReduceMotion(): boolean | null {
	const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

	useEffect(() => {
		let mounted = true;
		AccessibilityInfo.isReduceMotionEnabled()
			.then(enabled => {
				if (mounted) setReduceMotion(enabled);
			})
			.catch(() => {});
		const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', enabled => {
			setReduceMotion(enabled);
		});
		return () => {
			mounted = false;
			subscription?.remove();
		};
	}, []);

	return reduceMotion;
}

interface SkeletonBlockProps {
	width?: DimensionValue;
	height?: DimensionValue;
	radius?: number;
	style?: StyleProp<ViewStyle>;
}

/** A placeholder shape that pulses, or stays still when reduce motion is on (#317). */
export function SkeletonBlock({
	width = '100%',
	height = 16,
	radius = 4,
	style,
}: SkeletonBlockProps) {
	const { theme } = useTheme();
	const reduceMotion = useReduceMotion();
	const opacity = useMemo(() => new Animated.Value(1), []);

	useEffect(() => {
		if (reduceMotion !== false) {
			opacity.setValue(1);
			return undefined;
		}
		const pulse = Animated.loop(
			Animated.sequence([
				Animated.timing(opacity, {
					toValue: 0.4,
					duration: 800,
					easing: Easing.inOut(Easing.ease),
					useNativeDriver: true,
				}),
				Animated.timing(opacity, {
					toValue: 1,
					duration: 800,
					easing: Easing.inOut(Easing.ease),
					useNativeDriver: true,
				}),
			])
		);
		pulse.start();
		return () => pulse.stop();
	}, [reduceMotion, opacity]);

	return (
		<Animated.View
			testID="skeleton-block"
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
			style={[
				{
					width,
					height,
					borderRadius: radius,
					backgroundColor: theme.colors.surfaceAlt,
					opacity,
				},
				style,
			]}
		/>
	);
}
