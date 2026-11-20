import { act, renderHook } from '@testing-library/react-native';
import { Platform, type NativeSyntheticEvent, type TextInputFocusEventData } from 'react-native';
import { useFieldFocus } from './useFieldFocus';

const event = {} as NativeSyntheticEvent<TextInputFocusEventData>;

describe('useFieldFocus', () => {
	it('follows the focus on the web and chains the caller handlers', () => {
		jest.replaceProperty(Platform, 'OS', 'web');
		const onFocus = jest.fn();
		const onBlur = jest.fn();
		const { result } = renderHook(() => useFieldFocus({ onFocus, onBlur }));

		act(() => result.current.focusProps.onFocus?.(event));
		expect(result.current.focused).toBe(true);
		expect(onFocus).toHaveBeenCalledWith(event);

		act(() => result.current.focusProps.onBlur?.(event));
		expect(result.current.focused).toBe(false);
		expect(onBlur).toHaveBeenCalledWith(event);
	});

	it('never reports a focus on native, so the field keeps its look', () => {
		jest.replaceProperty(Platform, 'OS', 'android');
		const onFocus = jest.fn();
		const { result } = renderHook(() => useFieldFocus({ onFocus }));

		act(() => result.current.focusProps.onFocus?.(event));

		expect(result.current.focused).toBe(false);
		expect(onFocus).toHaveBeenCalled();
	});
});
