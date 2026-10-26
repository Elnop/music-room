import React from 'react';
import { ActivityIndicator } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Button } from './Button';
import { Text } from './Text';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

describe('Button', () => {
	it('shows the title and calls onPress when pressed', () => {
		const onPress = jest.fn();
		render(<Button title="Save" onPress={onPress} />);

		fireEvent.press(screen.getByText('Save'));

		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it('shows children when no title is given', () => {
		render(<Button onPress={jest.fn()}>Continue</Button>);
		expect(screen.getByText('Continue')).toBeTruthy();
	});

	it('is a button labelled by its text, or by an explicit label', () => {
		const { rerender } = render(<Button title="Save" onPress={jest.fn()} />);
		expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();

		rerender(<Button title="+" accessibilityLabel="Add a track" onPress={jest.fn()} />);
		expect(screen.getByRole('button', { name: 'Add a track' })).toBeTruthy();
	});

	it('does not call onPress when disabled', () => {
		const onPress = jest.fn();
		render(<Button title="Save" onPress={onPress} disabled />);

		fireEvent.press(screen.getByText('Save'));

		expect(onPress).not.toHaveBeenCalled();
	});

	it('shows a spinner instead of the text and blocks onPress while loading', () => {
		const onPress = jest.fn();
		render(<Button title="Save" onPress={onPress} loading />);

		expect(screen.queryByText('Save')).toBeNull();
		const spinner = screen.UNSAFE_getByType(ActivityIndicator);
		fireEvent.press(spinner);

		expect(onPress).not.toHaveBeenCalled();
	});

	it('renders the icon next to the text', () => {
		render(<Button title="Add" onPress={jest.fn()} icon={<Text>icon</Text>} />);
		expect(screen.getByText('icon')).toBeTruthy();
		expect(screen.getByText('Add')).toBeTruthy();
	});
});
