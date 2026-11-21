import { useEffect, useMemo, useState } from 'react';
import { debounce } from '@/shared/debounce/debounce';

import type { DebouncedText } from '@/features/playlists/features/editor/shared/debounced-text/debouncedTextTypes';

const SEARCH_DELAY_MS = 500;

export function useDebouncedText(): DebouncedText {
	const [text, setText] = useState('');
	const [settled, setSettled] = useState('');
	const settle = useMemo(() => debounce((value: string) => setSettled(value), SEARCH_DELAY_MS), []);

	useEffect(() => () => settle.cancel(), [settle]);

	function change(value: string) {
		setText(value);
		if (value.trim()) {
			settle(value);
		} else {
			settle.cancel();
			setSettled('');
		}
	}

	return {
		text,
		settled,
		pending: text.trim() !== '' && text !== settled,
		change,
		clear: () => change(''),
	};
}
