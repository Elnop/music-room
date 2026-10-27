import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/features/auth/types';
import { openExternalUrl } from '@/shared/utils/openExternalUrl';
import { WelcomeOrchestrator } from './WelcomeOrchestrator';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@/shared/components/form/BackendUrlField', () => {
	const { Text } = jest.requireActual('react-native');
	return { BackendUrlField: () => <Text>backend-url-field</Text> };
});

jest.mock('@/shared/services/deviceService', () => ({
	getBuildLabel: () => 'Zumik 1.0.0 (build 42 · a1b2c3d)',
}));

jest.mock('@/shared/utils/openExternalUrl', () => ({ openExternalUrl: jest.fn() }));

let mockLandingShown = false;
jest.mock('@/shared/constants/platform', () => ({
	get LANDING_SHOWN() {
		return mockLandingShown;
	},
}));

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const navigate = jest.fn();

function renderWelcome() {
	render(
		<WelcomeOrchestrator {...({ navigation: { navigate }, route: {} } as unknown as Props)} />
	);
}

beforeEach(() => {
	jest.clearAllMocks();
	mockLandingShown = false;
});

describe('WelcomeOrchestrator', () => {
	it('opens the register and login screens', () => {
		renderWelcome();

		fireEvent.press(screen.getByLabelText('Commencer'));
		fireEvent.press(screen.getByLabelText('Se connecter'));

		expect(navigate).toHaveBeenNthCalledWith(1, 'Register');
		expect(navigate).toHaveBeenNthCalledWith(2, 'Login');
	});

	it('shows the app build label', () => {
		renderWelcome();
		expect(screen.getByText('Zumik 1.0.0 (build 42 · a1b2c3d)')).toBeTruthy();
	});

	it('shows and hides the backend address field', () => {
		renderWelcome();
		expect(screen.queryByText('backend-url-field')).toBeNull();

		fireEvent.press(screen.getByLabelText('Serveur'));
		expect(screen.getByText('backend-url-field')).toBeTruthy();
		expect(screen.getByLabelText('Serveur').props.accessibilityState).toEqual({ expanded: true });

		fireEvent.press(screen.getByLabelText('Serveur'));
		expect(screen.queryByText('backend-url-field')).toBeNull();
	});

	it('opens the privacy policy without the landing on the phone app', () => {
		renderWelcome();
		expect(screen.queryByText('Fonctionnalités')).toBeNull();

		fireEvent.press(screen.getByLabelText('Politique de confidentialité'));
		expect(navigate).toHaveBeenCalledWith('PrivacyPolicy');
	});

	it('presents the app, its download and its contact on the web', () => {
		mockLandingShown = true;
		renderWelcome();

		expect(screen.getByText('Playlist Editor')).toBeTruthy();
		expect(screen.getByText('Music Control Delegation')).toBeTruthy();

		fireEvent.press(screen.getByLabelText('Télécharger pour Android'));
		fireEvent.press(screen.getByLabelText('leon.perrotin@gmail.com'));
		fireEvent.press(screen.getByLabelText('Code source'));
		expect(jest.mocked(openExternalUrl).mock.calls).toEqual([
			['https://github.com/Elnop/music-room/releases/latest'],
			['mailto:leon.perrotin@gmail.com'],
			['https://github.com/Elnop/music-room'],
		]);

		fireEvent.press(screen.getByLabelText('Politique de confidentialité'));
		expect(navigate).toHaveBeenCalledWith('PrivacyPolicy');
	});
});
