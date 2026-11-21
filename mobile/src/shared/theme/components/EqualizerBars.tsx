import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useLoop } from '@/shared/theme/hooks/useLoop';

const LEVELS = [0.25, 0.75, 0.5, 1, 0.5, 0.25, 0.75, 1, 0.75, 0.5, 0.25, 0.5, 1, 0.75, 0.25, 0.5];
const STEP_MS = 150;
const HOLD_END = 0.999;

function barLevels(bar: number) {
	return LEVELS.map((_, step) => LEVELS[(step + bar * 5) % LEVELS.length]);
}

function steppedRange(levels: number[]) {
	const count = levels.length;
	const inputRange = levels.flatMap((_, step) => [step / count, (step + HOLD_END) / count]);
	const outputRange = levels.flatMap(level => [level, level]);
	return { inputRange: [...inputRange, 1], outputRange: [...outputRange, levels[0]] };
}

type BarShape = {
	color: string;
	height: number;
	barWidth: number;
};

function rowStyle({ height, barWidth }: BarShape): ViewStyle {
	return { gap: barWidth / 1.5, height };
}

function barStyle(
	{ color, height, barWidth }: BarShape,
	scaleY: Animated.AnimatedInterpolation<number>
) {
	return { width: barWidth, height, backgroundColor: color, transform: [{ scaleY }] };
}

type EqualizerBarsProps = {
	color: string;
	bars?: number;
	height?: number;
	barWidth?: number;
	playing?: boolean;
};

export function EqualizerBars({
	color,
	bars = 4,
	height = 15,
	barWidth = 3,
	playing = true,
}: EqualizerBarsProps) {
	const progress = useLoop(playing, LEVELS.length * STEP_MS);
	const shape = { color, height, barWidth };

	return (
		<View style={[styles.row, rowStyle(shape)]} importantForAccessibility="no-hide-descendants">
			{Array.from({ length: bars }, (_, bar) => (
				<Animated.View
					key={bar}
					style={[styles.bar, barStyle(shape, progress.interpolate(steppedRange(barLevels(bar))))]}
				/>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'flex-end',
	},
	bar: {
		transformOrigin: 'bottom',
	},
});
