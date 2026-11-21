import type { ViewStyle } from 'react-native';
import { PIXEL } from '@/shared/theme/lib/tokens';

export function focusedFieldStyle(color: string): ViewStyle {
	return {
		borderColor: color,
		boxShadow: `0 0 0 ${PIXEL}px ${color}`,
	};
}
