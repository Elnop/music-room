import { useEffect, useRef } from 'react';
import type { TextInput } from 'react-native';
import { searchFocusActions } from '@/features/search/searchFocusStore';
import { useSearchFocusState } from '@/features/search/hooks/useSearchFocusState';

export function useSearchInputFocus() {
	const inputRef = useRef<TextInput>(null);
	const focusPending = useSearchFocusState((state) => state.pending);

	useEffect(() => {
		if (!focusPending) return;
		inputRef.current?.focus();
		searchFocusActions.consume();
	}, [focusPending]);

	return inputRef;
}
