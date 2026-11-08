import type { RefObject } from 'react';
import type { View } from 'react-native';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { useMenuAnchorStore } from '@/shared/stores/menuAnchorStore';

export function useAnchoredPress(button: RefObject<View | null>, onPress: () => void): () => void {
	const { isWide } = useBreakpoint();

	return () => {
		const node = button.current;
		if (!isWide || !node) {
			onPress();
			return;
		}
		node.measureInWindow((x, y, width, height) => {
			useMenuAnchorStore.getState().setAnchor({ x, y, width, height });
			onPress();
		});
	};
}
