import type { RefObject } from 'react';
import type { View } from 'react-native';
import { useMeasuredPress } from '@/shared/theme/hooks/useMeasuredPress';
import { recordMenuAnchor } from '@/shared/theme/menuAnchorStore';

export function useAnchoredPress(button: RefObject<View | null>, onPress: () => void): () => void {
	return useMeasuredPress(button, anchor => {
		recordMenuAnchor(anchor);
		onPress();
	});
}
