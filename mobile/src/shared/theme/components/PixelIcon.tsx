import React, { type ComponentType } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import type { SvgProps } from 'react-native-svg';

export type PixelIconSource = ComponentType<SvgProps>;

interface PixelIconProps {
	icon: PixelIconSource;
	color: string;
	size?: number;
	style?: StyleProp<ViewStyle>;
	accessibilityLabel?: string;
	testID?: string;
}

export function PixelIcon({
	icon: Icon,
	color,
	size = 24,
	style,
	accessibilityLabel,
	testID,
}: PixelIconProps) {
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
