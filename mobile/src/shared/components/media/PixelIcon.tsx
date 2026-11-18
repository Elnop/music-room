import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { PIXEL_ICONS, type PixelIconName } from '@/shared/constants/pixelIcons';

interface PixelIconProps {
	name: PixelIconName;
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
	const Icon = PIXEL_ICONS[name];

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
			<Icon width={size} height={size} fill={color} />
		</View>
	);
}
