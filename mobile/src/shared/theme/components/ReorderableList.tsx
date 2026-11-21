import React from 'react';
import type { FlatListProps } from 'react-native';
import { runOnJS } from 'react-native-reanimated';
import LibReorderableList from 'react-native-reorderable-list';
import { ReorderableCell } from '@/shared/theme/components/ReorderableCell';
import { useDragDecisionGesture } from '@/shared/theme/hooks/useDragDecisionGesture';
import { useOptimisticReorder } from '@/shared/theme/hooks/useOptimisticReorder';
import { hapticSelection } from '@/shared/theme/lib/haptics';
import type {
	ReorderableKeyExtractor,
	ReorderableRenderItem,
	ReorderHandler,
} from '@/shared/theme/types/reorderableTypes';

type PassThroughProps<T> = Pick<
	FlatListProps<T>,
	| 'ListHeaderComponent'
	| 'ListEmptyComponent'
	| 'contentContainerStyle'
	| 'showsVerticalScrollIndicator'
	| 'refreshControl'
	| 'extraData'
>;

type ReorderableListProps<T> = PassThroughProps<T> & {
	data: T[];
	keyExtractor: ReorderableKeyExtractor<T>;
	renderItem: ReorderableRenderItem<T>;
	onReorder: ReorderHandler;
	dragEnabled?: boolean;
};

function handleDragEdge() {
	'worklet';
	runOnJS(hapticSelection)();
}

export function ReorderableList<T>({
	data,
	renderItem,
	onReorder,
	...listProps
}: ReorderableListProps<T>) {
	const { items, handleReorder } = useOptimisticReorder(data, onReorder);
	const drag = useDragDecisionGesture();

	return (
		<LibReorderableList
			{...listProps}
			data={items}
			renderItem={({ item, index }) => (
				<ReorderableCell item={item} index={index} renderItem={renderItem} drag={drag} />
			)}
			onReorder={handleReorder}
			onDragStart={handleDragEdge}
			onDragEnd={handleDragEdge}
			dragEnabled={listProps.dragEnabled ?? true}
			panGesture={drag.panGesture}
			shouldUpdateActiveItem
		/>
	);
}
