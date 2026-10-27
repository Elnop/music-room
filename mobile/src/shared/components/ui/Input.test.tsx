import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Input } from './Input';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
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

	it('shows and hides a password with the eye button', () => {
		render(
			<Input
				label="Password"
				value="secret"
				onChangeText={jest.fn()}
				secureTextEntry
				testID="password-input"
			/>
		);

		fireEvent.press(screen.getByLabelText('Afficher le mot de passe'));
		expect(screen.getByTestId('password-input').props.secureTextEntry).toBe(false);

		fireEvent.press(screen.getByLabelText('Masquer le mot de passe'));
		expect(screen.getByTestId('password-input').props.secureTextEntry).toBe(true);
	});

	it('has no eye button on a plain field', () => {
		render(<Input label="Email" value="" onChangeText={jest.fn()} />);

		expect(screen.queryByLabelText('Afficher le mot de passe')).toBeNull();
	});

	describe('submitOnEnter', () => {
		const originalOS = Platform.OS;
		afterEach(() => {
			Platform.OS = originalOS;
		});

		const renderField = (props: { multiline?: boolean } = {}) => {
			const submit = jest.fn();
			render(
				<Input
					label="Name"
					value=""
					onChangeText={jest.fn()}
					placeholder="Name"
					submitOnEnter={submit}
					{...props}
				/>
			);
			fireEvent(screen.getByPlaceholderText('Name'), 'submitEditing');
			return submit;
		};

		it('submits the form on Enter in a browser', () => {
			Platform.OS = 'web';
			expect(renderField()).toHaveBeenCalledTimes(1);
		});

		it('leaves the native return key as it was', () => {
			Platform.OS = 'android';
			expect(renderField()).not.toHaveBeenCalled();
		});

		it('never submits from a multiline field, where Enter is a new line', () => {
			Platform.OS = 'web';
			expect(renderField({ multiline: true })).not.toHaveBeenCalled();
		});
	});
});
