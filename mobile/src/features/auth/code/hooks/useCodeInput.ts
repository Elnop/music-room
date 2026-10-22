import { useCallback, useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import { fillCodeDigits } from '@/features/auth/utils/codeDigits';

const EMPTY_CODE = ['', '', '', '', '', ''];

export interface CodeInput {
	/** One digit, or '', per box. */
	digits: string[];
	/** True once every box holds a digit. */
	isComplete: boolean;
	/** The ref callback of box `index`. */
	setBoxRef: (index: number) => (input: TextInput | null) => void;
	/** Applies a box's new text; returns the full code when it just became complete. */
	changeDigit: (index: number, text: string) => string | null;
	/** Backspace in an empty box moves the focus to the previous one. */
	pressKey: (index: number, key: string) => void;
	focusFirst: () => void;
	/** Empties every box and focuses the first one. */
	reset: () => void;
}

/** State and focus of the six boxes of a verification or reset code. */
export function useCodeInput(): CodeInput {
	const [digits, setDigits] = useState<string[]>(EMPTY_CODE);
	const boxes = useRef<(TextInput | null)[]>([]);

	const setBoxRef = useCallback(
		(index: number) => (input: TextInput | null) => {
			boxes.current[index] = input;
		},
		[]
	);

	const focusFirst = useCallback(() => boxes.current[0]?.focus(), []);

	const changeDigit = (index: number, text: string): string | null => {
		const result = fillCodeDigits(digits, index, text);
		if (!result) return null;

		setDigits(result.code);
		if (result.focusIndex !== null) boxes.current[result.focusIndex]?.focus();
		return text && result.code.every(digit => digit !== '') ? result.code.join('') : null;
	};

	const pressKey = (index: number, key: string) => {
		if (key === 'Backspace' && !digits[index] && index > 0) {
			boxes.current[index - 1]?.focus();
		}
	};

	const reset = () => {
		setDigits(EMPTY_CODE);
		focusFirst();
	};

	return {
		digits,
		isComplete: digits.every(digit => digit !== ''),
		setBoxRef,
		changeDigit,
		pressKey,
		focusFirst,
		reset,
	};
}
