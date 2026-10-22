import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '@/features/auth/stores/authStore';
import type { AuthStackParamList } from '@/features/auth/types';
import { resetBackendUrl } from '@/shared/services/backendUrl';
import { showError, showSuccess } from '@/shared/utils/toast';
import { logger } from '@/shared/utils/logger';
import { renderWithQuery } from '@/test/renderWithQuery';
import { fail, ok } from '@/test/fetchResponses';
import { ForgotPasswordOrchestrator } from './ForgotPasswordOrchestrator';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/features/auth/services/googleSignIn', () => ({ signInWithGoogle: jest.fn() }));
jest.mock('@/features/auth/services/facebookSignIn', () => ({ signInWithFacebook: jest.fn() }));
jest.mock('@/services/deviceService', () => ({ getAppVersion: () => '1.2.3' }));
jest.mock('socket.io-client', () => ({ io: jest.fn() }));
jest.mock('@/shared/utils/toast', () => ({ showError: jest.fn(), showSuccess: jest.fn() }));
jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const fetchMock = jest.fn();
const navigate = jest.fn();
let clear: () => void = () => undefined;

function renderScreen(params?: object) {
	const props = { navigation: { navigate }, route: { params } } as unknown as Props;
	const { client } = renderWithQuery(<ForgotPasswordOrchestrator {...props} />);
	clear = () => client.clear();
}

/** Path and JSON body of the request `index`. */
function request(index = 0): { url: string; body: unknown } {
	const [url, init] = fetchMock.mock.calls[index] as [string, RequestInit];
	return { url, body: init.body ? JSON.parse(init.body as string) : undefined };
}

beforeEach(async () => {
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	globalThis.fetch = fetchMock as unknown as typeof fetch;
	fetchMock.mockReset();
	navigate.mockReset();
	jest.mocked(showError).mockReset();
	jest.mocked(showSuccess).mockReset();
	await AsyncStorage.clear();
	await resetBackendUrl();
	useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false });
});

afterEach(() => {
	clear();
	jest.restoreAllMocks();
});

describe('ForgotPasswordOrchestrator', () => {
	it('sends the code to the prefilled email and opens the new password screen', async () => {
		fetchMock.mockResolvedValue(ok({ message: 'sent' }));
		renderScreen({ email: 'a@example.com' });

		fireEvent.press(screen.getByLabelText('Envoyer le code'));

		await waitFor(() =>
			expect(navigate).toHaveBeenCalledWith('ResetPassword', { email: 'a@example.com' })
		);
		expect(request().url).toMatch(/\/api\/auth\/forgot-password$/);
		expect(request().body).toEqual({ email: 'a@example.com' });
	});

	it('refuses an invalid email without a request', () => {
		renderScreen();

		fireEvent.changeText(screen.getByPlaceholderText('vous@exemple.com'), 'nope');
		fireEvent.press(screen.getByLabelText('Envoyer le code'));

		expect(screen.getByText('Saisissez un email valide')).toBeTruthy();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('shows the failure in the form', async () => {
		fetchMock.mockResolvedValue(fail(500, 'INTERNAL_ERROR'));
		renderScreen({ email: 'a@example.com' });

		fireEvent.press(screen.getByLabelText('Envoyer le code'));

		expect(
			await screen.findByText('Le serveur a rencontré un problème. Réessayez plus tard.')
		).toBeTruthy();
		expect(navigate).not.toHaveBeenCalled();
	});

	it('links to the login screen', () => {
		renderScreen();

		fireEvent.press(screen.getByLabelText('Se connecter'));

		expect(navigate).toHaveBeenCalledWith('Login');
	});
});
