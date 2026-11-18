import React from 'react';
import { PixelRatio, View, type StyleProp, type ViewStyle } from 'react-native';
import { PIXEL_SPRITES, type PixelSpriteName } from '@/shared/constants/pixelSprites';
import { pixelRuns } from '@/shared/utils/pixelRuns';

const GRID = 24;

const RUNS = Object.fromEntries(
	Object.entries(PIXEL_SPRITES).map(([name, rows]) => [name, pixelRuns(rows)])
) as Record<PixelSpriteName, ReturnType<typeof pixelRuns>>;

interface PixelIconProps {
	name: PixelSpriteName;
	color: string;
	size?: number;
	style?: StyleProp<ViewStyle>;
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
	const edge = (gridLine: number) => PixelRatio.roundToNearestPixel((gridLine * size) / GRID);

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
						left: edge(run.x),
						top: edge(run.y),
						width: edge(run.x + run.width) - edge(run.x),
						height: edge(run.y + 1) - edge(run.y),
						backgroundColor: color,
					}}
				/>
			))}
		</View>
	);
}
