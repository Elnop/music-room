import { useEffect, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { debounce } from '@/shared/debounce/debounce';
import type { SearchQueryState } from '@/features/search/searchTypes';

export function useDebouncedQuery(setQuery: Dispatch<SetStateAction<SearchQueryState>>) {
	const debouncedSetQuery = useMemo(
		() =>
			debounce((text: string) => {
				setQuery(current => ({ ...current, pending: false, debounced: text }));
			}, 500),
		[setQuery]
	);

	useEffect(() => () => debouncedSetQuery.cancel(), [debouncedSetQuery]);

	return debouncedSetQuery;
}
