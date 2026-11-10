import type { ViewStyle } from 'react-native';
import { PIXEL } from './tokens';

/** A focused field gets a second pixel outline in `color`; a shadow never moves the layout. */
export const focusedFieldStyle = (color: string): ViewStyle => ({
	borderColor: color,
	boxShadow: `0 0 0 ${PIXEL}px ${color}`,
});
