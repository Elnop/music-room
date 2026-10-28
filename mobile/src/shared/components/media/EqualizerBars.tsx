import React from 'react';
import { Animated, View } from 'react-native';
import { useLoop } from '@/shared/hooks/useLoop';

/** One bar's heights over a loop, as a share of the full height; each bar starts at another step. */
const STEPS = [0.2, 0.8, 0.4, 1, 0.2];

interface EqualizerBarsProps {
	color: string;
	bars?: number;
	height?: number;
	barWidth?: number;
	/** The bars freeze where they are while the music is paused. */
	playing?: boolean;
}

export function EqualizerBars({
	color,
	bars = 4,
	height = 15,
	barWidth = 3,
	playing = true,
}: EqualizerBarsProps) {
	const progress = useLoop(playing, 900);
	const inputRange = STEPS.map((_, i) => i / (STEPS.length - 1));

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
						transform: [
							{
								scaleY: progress.interpolate({
									inputRange,
									outputRange: STEPS.map((_, i) => STEPS[(i + bar * 2) % STEPS.length]),
								}),
							},
						],
					}}
				/>
			))}
		</View>
	);
}
