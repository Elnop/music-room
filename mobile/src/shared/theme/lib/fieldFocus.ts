import type { ViewStyle } from 'react-native';
import { PIXEL } from './tokens';

export const focusedFieldStyle = (color: string): ViewStyle => ({
	borderColor: color,
	boxShadow: `0 0 0 ${PIXEL}px ${color}`,
});
