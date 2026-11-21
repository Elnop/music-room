import { Text } from '@/shared/theme/components/Text';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/features/user/features/auth/types';
import { openExternalUrl } from '@/shared/external-links/openExternalUrl';
import { WelcomeContainer } from '@/features/user/features/auth/features/welcome/components/WelcomeContainer';

jest.mock('@/shared/theme/hooks/useTheme', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/configs/originalThemeConfig');
	return { useTheme: () => ({ theme: originalTheme }) };
});
jest.mock('@/shared/backend/deviceService', () => ({
	getBuildLabel: () => 'Zumik 1.0.0 (build 42 · a1b2c3d)',
}));

jest.mock('@/shared/external-links/openExternalUrl', () => ({ openExternalUrl: jest.fn() }));

let mockLandingShown = false;
jest.mock('@/shared/platform/platformConfig', () => ({
	get LANDING_SHOWN() {
		return mockLandingShown;
	},
}));

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const navigate = jest.fn();

function renderWelcome() {
	render(
		<WelcomeContainer
			{...({ navigation: { navigate }, route: {} } as unknown as Props)}
			backendUrlField={<Text>backend-url-field</Text>}
		/>
	);
}

beforeEach(() => {
	jest.clearAllMocks();
	mockLandingShown = false;
});

describe('WelcomeContainer', () => {
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
		expect(screen.getByLabelText('Serveur').props.accessibilityState.expanded).toBe(true);

		fireEvent.press(screen.getByLabelText('Serveur'));
		expect(screen.queryByText('backend-url-field')).toBeNull();
	});

	it('opens the privacy policy without the landing on the phone app', () => {
		renderWelcome();
		expect(screen.queryByText('Fonctionnalités')).toBeNull();

		expect(screen.queryByText(/@/u)).toBeNull();

		fireEvent.press(screen.getByLabelText('Politique de confidentialité'));
		expect(navigate).toHaveBeenCalledWith('PrivacyPolicy');
	});

	it('presents the app and its download on the web, without a contact address', () => {
		mockLandingShown = true;
		renderWelcome();

		expect(screen.getByText('Playlist Editor')).toBeTruthy();
		expect(screen.getByText('Music Control Delegation')).toBeTruthy();

		fireEvent.press(screen.getByLabelText('Télécharger pour Android'));
		fireEvent.press(screen.getByLabelText('Code source'));
		expect(jest.mocked(openExternalUrl).mock.calls).toStrictEqual([
			['https://github.com/Elnop/music-room/releases/latest', expect.any(Function)],
			['https://github.com/Elnop/music-room', expect.any(Function)],
		]);

		fireEvent.press(screen.getByLabelText('Politique de confidentialité'));
		expect(navigate).toHaveBeenCalledWith('PrivacyPolicy');
	});
});
