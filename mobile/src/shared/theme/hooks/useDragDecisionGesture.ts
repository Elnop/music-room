import { useMemo } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import type { DragDecision } from '@/shared/theme/types/reorderableTypes';
import { dragDecisionGesture } from '@/shared/theme/lib/dragDecisionGesture';

export function useDragDecisionGesture(): DragDecision {
	const dragRequested = useSharedValue(false);
	const touchStart = useSharedValue({ x: 0, y: 0 });
	const panGesture = useMemo(
		() => dragDecisionGesture(dragRequested, touchStart),
		[dragRequested, touchStart],
	);
	return { dragRequested, panGesture };
}
