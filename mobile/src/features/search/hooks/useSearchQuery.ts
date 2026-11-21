import { useCallback, useState } from 'react';
import { useDebouncedQuery } from '@/features/search/hooks/useDebouncedQuery';
import type { SearchQueryState } from '@/features/search/searchTypes';

const EMPTY_QUERY: SearchQueryState = { text: '', debounced: '', pending: false };

export function useSearchQuery() {
	const [query, setQuery] = useState<SearchQueryState>(EMPTY_QUERY);
	const debouncedSetQuery = useDebouncedQuery(setQuery);

	const onSearchChange = useCallback(
		(text: string) => {
			if (text.trim()) {
				setQuery(current => ({ ...current, text, pending: true }));
				debouncedSetQuery(text.trim());
			} else {
				debouncedSetQuery.cancel();
				setQuery({ text, debounced: '', pending: false });
			}
		},
		[debouncedSetQuery]
	);

	const settle = useCallback(() => {
		debouncedSetQuery.cancel();
		setQuery(current => ({ ...current, pending: false }));
	}, [debouncedSetQuery]);

	return { query, onSearchChange, settle };
}
