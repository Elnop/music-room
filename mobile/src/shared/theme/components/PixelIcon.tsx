import React from 'react';
import type { ComponentType } from 'react';
import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
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
			accessible={Boolean(accessibilityLabel)}
			accessibilityRole={accessibilityLabel ? 'image' : undefined}
			accessibilityLabel={accessibilityLabel}
			importantForAccessibility={accessibilityLabel ? 'yes' : 'no'}
		>
			<Icon width={size} height={size} fill={color} />
		</View>
	);
}
