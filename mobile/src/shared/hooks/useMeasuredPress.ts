import type { RefObject } from 'react';
import type { View } from 'react-native';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import type { MenuAnchor } from '@/shared/utils/menuPlacement';

export function useMeasuredPress(
	button: RefObject<View | null>,
	onPress: (anchor?: MenuAnchor) => void
): () => void {
	const { isWide } = useBreakpoint();

	return () => {
		const node = button.current;
		if (!isWide || !node) {
			onPress();
			return;
		}
		node.measureInWindow((x, y, width, height) => onPress({ x, y, width, height }));
	};
}
