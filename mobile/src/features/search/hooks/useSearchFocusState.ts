import { useStore } from 'zustand';
import type { ExtractState } from 'zustand';
import { searchFocusStore } from '@/features/search/searchFocusStore';

export function useSearchFocusState<T>(
	selector: (state: ExtractState<typeof searchFocusStore>) => T,
): T {
	return useStore(searchFocusStore, selector);
}
