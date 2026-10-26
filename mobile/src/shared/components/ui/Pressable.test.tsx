import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { HOVERED_OPACITY, PRESSED_OPACITY, Pressable, pressableStyle } from './Pressable';
import { hapticSelection, hapticTap } from '@/shared/utils/haptics';

jest.mock('@/shared/utils/haptics', () => ({
	hapticTap: jest.fn(),
	hapticSelection: jest.fn(),
	hapticSuccess: jest.fn(),
}));

describe('Pressable', () => {
	beforeEach(() => jest.clearAllMocks());

	it('is a labelled button by default and calls onPress', () => {
		const onPress = jest.fn();
		render(
			<Pressable accessibilityLabel="Play" onPress={onPress}>
				<Text>Play</Text>
			</Pressable>
		);

		fireEvent.press(screen.getByRole('button', { name: 'Play' }));

		expect(onPress).toHaveBeenCalledTimes(1);
		expect(hapticTap).not.toHaveBeenCalled();
	});

	it('keeps an explicit accessibility role', () => {
		render(<Pressable accessibilityLabel="Saved" accessibilityRole="alert" onPress={jest.fn()} />);
		expect(screen.getByRole('alert', { name: 'Saved' })).toBeTruthy();
	});

	it('fires the requested haptic before onPress', () => {
		const calls: string[] = [];
		jest.mocked(hapticSelection).mockImplementation(() => calls.push('haptic'));
		render(
			<Pressable accessibilityLabel="Pick" haptic="selection" onPress={() => calls.push('press')} />
		);

		fireEvent.press(screen.getByRole('button', { name: 'Pick' }));

		expect(calls).toEqual(['haptic', 'press']);
	});

	it('does not call onPress while disabled', () => {
		const onPress = jest.fn();
		render(<Pressable accessibilityLabel="Save" onPress={onPress} disabled haptic="tap" />);

		fireEvent.press(screen.getByRole('button', { name: 'Save' }));

		expect(onPress).not.toHaveBeenCalled();
		expect(hapticTap).not.toHaveBeenCalled();
	});

	it('dims to the shared opacity while pressed', () => {
		const { rerender } = render(
			<Pressable accessibilityLabel="Hold" onPress={jest.fn()} style={{ margin: 4 }} />
		);
		const style = () => StyleSheet.flatten(screen.getByRole('button').props.style);
		expect(style().opacity).toBeUndefined();

		rerender(
			<Pressable
				accessibilityLabel="Hold"
				onPress={jest.fn()}
				style={{ margin: 4 }}
				testOnly_pressed
			/>
		);
		expect(style()).toMatchObject({ margin: 4, opacity: PRESSED_OPACITY });
	});

	it('lightens under the mouse pointer, unless disabled or pressed', () => {
		const opacity = (pressed: boolean, hovered: boolean, disabled = false) =>
			StyleSheet.flatten(pressableStyle({ margin: 4 }, { pressed, hovered }, disabled)).opacity;

		expect(opacity(false, true)).toBe(HOVERED_OPACITY);
		expect(opacity(true, true)).toBe(PRESSED_OPACITY);
		expect(opacity(false, false)).toBeUndefined();
		expect(opacity(false, true, true)).toBeUndefined();
	});
});
