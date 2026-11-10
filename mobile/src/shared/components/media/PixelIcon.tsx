import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
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
	style?: StyleProp<ViewStyle>;
	/** An icon that alone tells a state (playing, unavailable) names it for screen readers. */
	accessibilityLabel?: string;
	testID?: string;
}

/** Decorative unless labelled: the control around it usually carries the label. */
export function PixelIcon({
	name,
	color,
	size = 24,
	style,
	accessibilityLabel,
	testID,
}: PixelIconProps) {
	const cell = size / GRID;

	return (
		<View
			style={[{ width: size, height: size }, style]}
			pointerEvents="none"
			testID={testID}
			accessible={!!accessibilityLabel}
			accessibilityRole={accessibilityLabel ? 'image' : undefined}
			accessibilityLabel={accessibilityLabel}
			importantForAccessibility={accessibilityLabel ? 'yes' : 'no'}
		>
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
