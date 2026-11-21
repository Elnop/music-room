import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SocialSignInButtons } from '@/features/user/features/auth/shared/sign-in/components/SocialSignInButtons';

jest.mock('@/shared/theme/hooks/useTheme', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/configs/originalThemeConfig');
	return { useTheme: () => ({ theme: originalTheme }) };
});

describe('SocialSignInButtons', () => {
	it('draws its own Google button without a slot (native)', () => {
		const onGoogle = jest.fn();
		render(
			<SocialSignInButtons
				social={{ onGoogle, onFacebook: jest.fn(), isPending: false }}
				disabled={false}
			/>
		);

		fireEvent.press(screen.getByLabelText('Continuer avec Google'));

		expect(onGoogle).toHaveBeenCalledTimes(1);
		expect(screen.queryByTestId('google-button-slot')).toBeNull();
	});

	it("gives Google's button a slot and keeps Facebook's (web)", () => {
		const googleButton = jest.fn();
		const onFacebook = jest.fn();
		render(
			<SocialSignInButtons
				social={{ onGoogle: jest.fn(), onFacebook, googleButton, isPending: false }}
				disabled={false}
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
				social={{
					onGoogle: jest.fn(),
					onFacebook: jest.fn(),
					googleButton: jest.fn(),
					isPending: false,
				}}
				disabled={false}
			/>
		);

		expect(
			StyleSheet.flatten(screen.getByLabelText('Continuer avec Facebook').props.style)
		).toMatchObject({ height: 40, maxWidth: 400, borderRadius: 4 });
	});
});
