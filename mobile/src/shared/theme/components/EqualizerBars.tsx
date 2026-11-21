import React from 'react';
import { Animated, View } from 'react-native';
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

interface EqualizerBarsProps {
	color: string;
	bars?: number;
	height?: number;
	barWidth?: number;
	playing?: boolean;
}

export function EqualizerBars({
	color,
	bars = 4,
	height = 15,
	barWidth = 3,
	playing = true,
}: EqualizerBarsProps) {
	const progress = useLoop(playing, LEVELS.length * STEP_MS);

	return (
		<View
			style={{ flexDirection: 'row', alignItems: 'flex-end', gap: barWidth / 1.5, height }}
			importantForAccessibility="no-hide-descendants"
		>
			{Array.from({ length: bars }, (_, bar) => (
				<Animated.View
					key={bar}
					style={{
						width: barWidth,
						height,
						backgroundColor: color,
						transformOrigin: 'bottom',
						transform: [{ scaleY: progress.interpolate(steppedRange(barLevels(bar))) }],
					}}
				/>
			))}
		</View>
	);
}
