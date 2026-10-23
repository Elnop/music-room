import { useEffect, useMemo, useState } from 'react';
import { debounce } from '@/shared/utils/debounce';

const SEARCH_DELAY_MS = 500;

export interface DebouncedText {
	text: string;
	/** `text` once the user stopped typing; emptied at once when the text is cleared. */
	settled: string;
	/** Typed but not settled yet: counts as loading. */
	pending: boolean;
	change: (text: string) => void;
	clear: () => void;
}

/** A search field whose value settles 500 ms after the last keystroke. */
export function useDebouncedText(): DebouncedText {
	const [text, setText] = useState('');
	const [settled, setSettled] = useState('');
	const settle = useMemo(() => debounce((value: string) => setSettled(value), SEARCH_DELAY_MS), []);

	useEffect(() => () => settle.cancel(), [settle]);

	const change = (value: string) => {
		setText(value);
		if (value.trim()) {
			settle(value);
		} else {
			// Cleared: drop the results now rather than after the delay.
			settle.cancel();
			setSettled('');
		}
	};

	return {
		text,
		settled,
		pending: text.trim() !== '' && text !== settled,
		change,
		clear: () => change(''),
	};
}
