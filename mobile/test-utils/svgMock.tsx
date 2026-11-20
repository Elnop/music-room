import React from 'react';
import { View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

export default function SvgMock({ width, height, fill }: SvgProps) {
	return (
		<View
			testID="svg-icon"
			style={{ width: Number(width), height: Number(height) }}
			accessibilityHint={String(fill)}
		/>
	);
}
