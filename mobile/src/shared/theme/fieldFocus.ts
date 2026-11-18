import type { ViewStyle } from 'react-native';
import { PIXEL } from './tokens';

/** A shadow draws the second outline, so focus never moves the layout. */
export const focusedFieldStyle = (color: string): ViewStyle => ({
	borderColor: color,
	boxShadow: `0 0 0 ${PIXEL}px ${color}`,
});
