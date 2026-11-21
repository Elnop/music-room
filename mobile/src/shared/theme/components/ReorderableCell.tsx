import { useIsActive, useReorderableDrag } from 'react-native-reorderable-list';
import type { DragDecision, ReorderableRenderItem } from '@/shared/theme/types/reorderableTypes';

type ReorderableCellProps<T> = {
	item: T;
	index: number;
	renderItem: ReorderableRenderItem<T>;
	drag: DragDecision;
};

export function ReorderableCell<T>({
	item,
	index,
	renderItem,
	drag: decision,
}: ReorderableCellProps<T>) {
	const startDrag = useReorderableDrag();
	const isActive = useIsActive();
	function drag() {
		decision.dragRequested.set(true);
		startDrag();
	}
	return renderItem({ item, index, drag, isActive });
}
