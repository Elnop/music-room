import type { ViewStyle } from 'react-native';
import { hexToRgba } from './adaptivePalette';

/** The frame of a focused field turns `color`, and a halo follows its radius; shadows never move the layout. */
export const focusedFieldStyle = (color: string): ViewStyle => ({
	borderColor: color,
	boxShadow: `0 0 0 1px ${color}, 0 0 0 4px ${hexToRgba(color, 0.3)}`,
});
