import React from 'react';
import { View } from 'react-native';
import { PIXEL_SPRITES, type PixelSpriteName } from '@/shared/constants/pixelSprites';
import { pixelRuns } from '@/shared/utils/pixelRuns';

const GRID = 12;

// Computed once: a sprite never changes at run time.
const RUNS = Object.fromEntries(
	Object.entries(PIXEL_SPRITES).map(([name, rows]) => [name, pixelRuns(rows)])
) as Record<PixelSpriteName, ReturnType<typeof pixelRuns>>;

interface PixelIconProps {
	name: PixelSpriteName;
	color: string;
	/** A multiple of 12 keeps every pixel square and sharp. */
	size?: number;
}

/** Decorative: the control around it carries the accessible label. */
export function PixelIcon({ name, color, size = 24 }: PixelIconProps) {
	const cell = size / GRID;

	return (
		<View style={{ width: size, height: size }} pointerEvents="none" importantForAccessibility="no">
			{RUNS[name].map(run => (
				<View
					key={`${run.x}-${run.y}`}
					style={{
						position: 'absolute',
						left: run.x * cell,
						top: run.y * cell,
						width: run.width * cell,
						height: cell,
						backgroundColor: color,
					}}
				/>
			))}
		</View>
	);
}
