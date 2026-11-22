import type { RefObject } from 'react';
import type { View } from 'react-native';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';

export function useMeasuredPress(
	button: RefObject<View | null>,
	onPress: (anchor?: MenuAnchor) => void,
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
