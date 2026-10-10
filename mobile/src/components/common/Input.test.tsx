import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Input } from '@/components/common/Input';

jest.mock('@/contexts/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@themes/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

describe('Input', () => {
	it('shows the label and calls onChangeText when typing', () => {
		const onChangeText = jest.fn();
		render(<Input label="Email" value="" onChangeText={onChangeText} placeholder="you@mail.com" />);

		expect(screen.getByText('Email')).toBeTruthy();
		fireEvent.changeText(screen.getByPlaceholderText('you@mail.com'), 'a@b.c');

		expect(onChangeText).toHaveBeenCalledWith('a@b.c');
	});

	it('shows the error only when set', () => {
		const { rerender } = render(<Input label="Email" value="" onChangeText={jest.fn()} />);
		expect(screen.queryByText('Required')).toBeNull();

		rerender(<Input label="Email" value="" onChangeText={jest.fn()} error="Required" />);
		expect(screen.getByText('Required')).toBeTruthy();
	});

	it('forwards props to the text input', () => {
		render(
			<Input
				label="Password"
				value="secret"
				onChangeText={jest.fn()}
				placeholder="Password"
				secureTextEntry
				testID="password-input"
			/>
		);

		const input = screen.getByTestId('password-input');
		expect(input.props.placeholder).toBe('Password');
		expect(input.props.secureTextEntry).toBe(true);
		expect(input.props.value).toBe('secret');
	});
});
