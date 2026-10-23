import React from 'react';
import type { FlatListProps } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import LibReorderableList, {
	reorderItems,
	useIsActive,
	useReorderableDrag,
	type ReorderableListReorderEvent,
} from 'react-native-reorderable-list';
import { hapticSelection } from '@/shared/utils/haptics';

interface ReorderableRenderItemInfo<T> {
	item: T;
	index: number;
	/** Starts dragging this row; call it from a handle's onPressIn. */
	drag: () => void;
	isActive: boolean;
}

type PassThroughProps<T> = Pick<
	FlatListProps<T>,
	| 'ListHeaderComponent'
	| 'ListEmptyComponent'
	| 'contentContainerStyle'
	| 'showsVerticalScrollIndicator'
	| 'refreshControl'
	| 'extraData'
>;

interface ReorderableListProps<T> extends PassThroughProps<T> {
	data: T[];
	keyExtractor: (item: T, index: number) => string;
	renderItem: (info: ReorderableRenderItemInfo<T>) => React.ReactElement | null;
	/** Once a returned promise settles, the rows show the order of `data` again. */
	onReorder: (from: number, to: number) => void | Promise<unknown>;
	dragEnabled?: boolean;
}

interface CellProps<T> {
	item: T;
	index: number;
	renderItem: ReorderableListProps<T>['renderItem'];
}

// The library's hooks only work inside a cell, so each row renders through this.
function Cell<T>({ item, index, renderItem }: CellProps<T>) {
	const drag = useReorderableDrag();
	const isActive = useIsActive();
	return renderItem({ item, index, drag, isActive });
}

/** A drag starts only when a row calls `drag`, so the list still scrolls and rows can still swipe. */
export function ReorderableList<T>({
	data,
	keyExtractor,
	renderItem,
	onReorder,
	dragEnabled = true,
	...listProps
}: ReorderableListProps<T>) {
	// The dropped order, valid only while `data` is still the array it was built from.
	const [override, setOverride] = React.useState<{ base: T[]; items: T[] } | null>(null);
	const items = override && override.base === data ? override.items : data;

	// Vertical only: a horizontal move is left to the row (swipe to delete).
	const panGesture = React.useMemo(() => Gesture.Pan().activeOffsetY([-5, 5]), []);

	const handleReorder = ({ from, to }: ReorderableListReorderEvent) => {
		if (from === to) return;
		setOverride({ base: data, items: reorderItems(items, from, to) });
		const result = onReorder(from, to);
		if (result) {
			// Once the move settles, `data` is the truth again, even if it did not change.
			const clear = () => setOverride(null);
			result.then(clear, clear);
		}
	};

	// The library calls these on the UI thread: they must be worklets. One tick at pick-up, one at drop.
	const handleDragEdge = () => {
		'worklet';
		runOnJS(hapticSelection)();
	};

	return (
		<LibReorderableList
			{...listProps}
			data={items}
			keyExtractor={keyExtractor}
			renderItem={({ item, index }) => <Cell item={item} index={index} renderItem={renderItem} />}
			onReorder={handleReorder}
			onDragStart={handleDragEdge}
			onDragEnd={handleDragEdge}
			dragEnabled={dragEnabled}
			panGesture={panGesture}
			shouldUpdateActiveItem
		/>
	);
}
