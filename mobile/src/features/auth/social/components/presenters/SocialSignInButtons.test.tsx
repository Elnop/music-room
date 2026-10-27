import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SocialSignInButtons } from './SocialSignInButtons';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

describe('SocialSignInButtons', () => {
	it('draws its own Google button without a slot (native)', () => {
		const onGoogle = jest.fn();
		render(<SocialSignInButtons onGoogle={onGoogle} onFacebook={jest.fn()} disabled={false} />);

		fireEvent.press(screen.getByLabelText('Continuer avec Google'));

		expect(onGoogle).toHaveBeenCalledTimes(1);
		expect(screen.queryByTestId('google-button-slot')).toBeNull();
	});

	it("gives Google's button a slot and keeps Facebook's (web)", () => {
		const googleButton = jest.fn();
		const onFacebook = jest.fn();
		render(
			<SocialSignInButtons
				onGoogle={jest.fn()}
				onFacebook={onFacebook}
				disabled={false}
				googleButton={googleButton}
			/>
		);

		fireEvent.press(screen.getByLabelText('Continuer avec Facebook'));

		expect(screen.getByTestId('google-button-slot')).toBeTruthy();
		expect(screen.queryByLabelText('Continuer avec Google')).toBeNull();
		expect(googleButton).toHaveBeenCalledWith(expect.anything());
		expect(onFacebook).toHaveBeenCalledTimes(1);
	});

	it("sizes Facebook's button like Google's beside it (web)", () => {
		render(
			<SocialSignInButtons
				onGoogle={jest.fn()}
				onFacebook={jest.fn()}
				disabled={false}
				googleButton={jest.fn()}
			/>
		);

		expect(
			StyleSheet.flatten(screen.getByLabelText('Continuer avec Facebook').props.style)
		).toMatchObject({ height: 40, maxWidth: 400, borderRadius: 4 });
	});
});
