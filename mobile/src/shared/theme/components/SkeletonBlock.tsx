import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import { useSkeletonPulse } from '@/shared/theme/hooks/useSkeletonPulse';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type SkeletonBlockProps = {
	width?: DimensionValue;
	height?: DimensionValue;
	radius?: number;
	style?: StyleProp<ViewStyle>;
};

function blockStyle(
	width: DimensionValue,
	height: DimensionValue,
	radius: number,
	opacity: Animated.Value
) {
	return { width, height, borderRadius: radius, opacity };
}

export function SkeletonBlock({
	width = '100%',
	height = 16,
	radius = 4,
	style,
}: SkeletonBlockProps) {
	const { styles } = useThemedStyles(createStyles);
	const opacity = useSkeletonPulse();

	return (
		<Animated.View
			testID="skeleton-block"
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
			style={[styles.block, blockStyle(width, height, radius, opacity), style]}
		/>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		block: {
			backgroundColor: theme.colors.surfaceAlt,
		},
	});
	return styles;
}
