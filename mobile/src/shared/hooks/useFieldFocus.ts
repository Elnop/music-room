import { useMemo, useState } from 'react';
import { Platform, type TextInputProps } from 'react-native';

type FocusHandlers = Pick<TextInputProps, 'onFocus' | 'onBlur'>;

/** Whether a text field has the focus (web only: native fields keep their look), with the caller's handlers chained. */
export function useFieldFocus({ onFocus, onBlur }: FocusHandlers = {}) {
	const [focused, setFocused] = useState(false);
	const focusProps = useMemo<FocusHandlers>(
		() => ({
			onFocus: event => {
				setFocused(true);
				onFocus?.(event);
			},
			onBlur: event => {
				setFocused(false);
				onBlur?.(event);
			},
		}),
		[onFocus, onBlur]
	);
	return { focused: Platform.OS === 'web' && focused, focusProps };
}
