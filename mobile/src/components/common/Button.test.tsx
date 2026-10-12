import React from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Button } from '@/components/common/Button';

jest.mock('@/contexts/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@themes/original.theme');
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
