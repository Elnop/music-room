import type { TextStyle, ViewStyle } from 'react-native';

export function textColor(color: string): TextStyle {
	return { color };
}

export function backgroundColor(color: string): ViewStyle {
	return { backgroundColor: color };
}

export function boxSize(width: number, height: number = width): ViewStyle {
	return { width, height };
}

export function boxWidth(width: number): ViewStyle {
	return { width };
}
