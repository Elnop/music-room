import { useCallback, useRef } from 'react';
import type { TextInput } from 'react-native';
import type { CodeBoxes } from '@/features/user/features/auth/shared/code-input/codeInputTypes';

export function useCodeBoxes(): CodeBoxes {
	const boxes = useRef<(TextInput | null)[]>([]);

	const setBoxRef = useCallback(
		(index: number) => (input: TextInput | null) => {
			boxes.current[index] = input;
		},
		[],
	);

	const focusFirst = useCallback(() => boxes.current[0]?.focus(), []);

	return {
		setBoxRef,
		focus: (index) => boxes.current[index]?.focus(),
		focusFirst,
	};
}
