import React, { type ReactElement } from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ProfileScreen } from './ProfileScreen';

const mockLogout = jest.fn();
const mockNavigate = jest.fn();
const mockSetOptions = jest.fn();

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/contexts/PlayerContext', () => ({
	usePlayerHeight: () => 0,
}));

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ navigate: mockNavigate, setOptions: mockSetOptions }),
	useFocusEffect: jest.fn(),
}));

jest.mock('@/features/auth/stores/authStore', () => {
	const state = {
		user: { id: 'me', displayName: 'Bob', email: 'bob@example.com', createdAt: '2026-10-01' },
		logout: () => mockLogout(),
		isLoading: false,
		accessToken: 'token',
		isAuthenticated: true,
	};
	const useAuthStore = () => state;
	useAuthStore.getState = () => state;
	return { useAuthStore };
});

jest.mock('@/services/privacyApi', () => ({ privacyApi: {} }));
jest.mock('@/services/friendsApi', () => ({ friendsApi: {} }));
jest.mock('@/shared/components/theme/ThemeSelector', () => ({ ThemeSelector: () => null }));

type AlertButtons = Parameters<typeof Alert.alert>[2];

describe('ProfileScreen logout', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(Alert, 'alert').mockImplementation(() => {});
	});

	const pressLogout = (): AlertButtons => {
		render(<ProfileScreen />);
		fireEvent.press(screen.getByText('Se déconnecter'));
		expect(Alert.alert).toHaveBeenCalledWith('Se déconnecter ?', expect.any(String), [
			expect.objectContaining({ text: 'Annuler', style: 'cancel' }),
			expect.objectContaining({ text: 'Se déconnecter', style: 'destructive' }),
		]);
		return (Alert.alert as jest.Mock).mock.calls[0][2];
	};

	it('asks for confirmation instead of logging out on the first tap', () => {
		pressLogout();
		expect(mockLogout).not.toHaveBeenCalled();
	});

	it('logs out once confirmed', () => {
		const buttons = pressLogout();
		buttons?.find(b => b.text === 'Se déconnecter')?.onPress?.();
		expect(mockLogout).toHaveBeenCalledTimes(1);
	});

	it('stays signed in when cancelled', () => {
		const buttons = pressLogout();
		buttons?.find(b => b.text === 'Annuler')?.onPress?.();
		expect(mockLogout).not.toHaveBeenCalled();
	});
});

describe('ProfileScreen header', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	/** Renders the header buttons the screen hands to the native stack. */
	const renderHeader = () => {
		render(<ProfileScreen />);
		const { headerRight } = mockSetOptions.mock.calls.at(-1)[0] as {
			headerRight: () => ReactElement;
		};
		render(headerRight());
	};

	it('opens the profile editor from the pencil', () => {
		renderHeader();
		fireEvent.press(screen.getByRole('button', { name: 'Modifier le profil' }));
		expect(mockNavigate).toHaveBeenCalledWith('EditProfile');
	});

	it('opens the settings from the gear', () => {
		renderHeader();
		fireEvent.press(screen.getByRole('button', { name: 'Réglages' }));
		expect(mockNavigate).toHaveBeenCalledWith('Settings');
	});
});
