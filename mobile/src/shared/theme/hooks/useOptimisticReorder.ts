import { useState } from 'react';
import { reorderItems } from 'react-native-reorderable-list';
import type { ReorderableListReorderEvent } from 'react-native-reorderable-list';
import type { ReorderHandler } from '@/shared/theme/types/reorderableTypes';

type ReorderOverride<T> = { base: T[]; items: T[] };

export function useOptimisticReorder<T>(data: T[], onReorder: ReorderHandler) {
	const [override, setOverride] = useState<ReorderOverride<T> | null>(null);
	const items = override && override.base === data ? override.items : data;

	function handleReorder({ from, to }: ReorderableListReorderEvent) {
		if (from === to) return;
		setOverride({ base: data, items: reorderItems(items, from, to) });
		const result = onReorder(from, to);
		if (result) {
			function clear() {
				return setOverride(null);
			}
			result.then(clear, clear);
		}
	}

	return { items, handleReorder };
}
