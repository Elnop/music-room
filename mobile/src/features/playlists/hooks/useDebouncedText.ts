import { useEffect, useMemo, useState } from 'react';
import { debounce } from '@/shared/utils/debounce';

const SEARCH_DELAY_MS = 500;

export interface DebouncedText {
	text: string;
	settled: string;
	pending: boolean;
	change: (text: string) => void;
	clear: () => void;
}

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
