import { useState } from 'react';
import { fillCodeDigits } from '@/features/user/features/auth/shared/code-input/fillCodeDigits';
import { CODE_BOX_KEYS } from '@/features/user/features/auth/shared/code-input/codeInputConfig';
import { useCodeBoxes } from '@/features/user/features/auth/shared/code-input/hooks/useCodeBoxes';
import type { CodeInputState } from '@/features/user/features/auth/shared/code-input/codeInputTypes';

const EMPTY_CODE = CODE_BOX_KEYS.map(() => '');

function isFilled(digits: readonly string[]): boolean {
	return digits.every((digit) => digit !== '');
}

export function useCodeInput(): CodeInputState {
	const [digits, setDigits] = useState<string[]>(EMPTY_CODE);
	const boxes = useCodeBoxes();

	function changeDigit(index: number, text: string): string | null {
		const result = fillCodeDigits(digits, index, text);
		if (!result) return null;

		setDigits(result.code);
		if (result.focusIndex !== null) boxes.focus(result.focusIndex);
		return text && isFilled(result.code) ? result.code.join('') : null;
	}

	return {
		digits,
		isComplete: isFilled(digits),
		setBoxRef: boxes.setBoxRef,
		changeDigit,
		pressKey: (index, key) => {
			if (key === 'Backspace' && !digits[index] && index > 0) boxes.focus(index - 1);
		},
		focusFirst: boxes.focusFirst,
		reset: () => {
			setDigits(EMPTY_CODE);
			boxes.focusFirst();
		},
	};
}
