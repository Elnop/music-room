import React from 'react';
import { View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

export default function SvgMock({ width, height, fill }: SvgProps) {
	const size = { width: Number(width), height: Number(height) };
	return <View testID="svg-icon" style={size} accessibilityHint={String(fill)} />;
}
