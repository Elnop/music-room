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
import { ResetPasswordOrchestrator } from './ResetPasswordOrchestrator';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/features/auth/services/googleSignIn', () => ({ signInWithGoogle: jest.fn() }));
jest.mock('@/features/auth/services/facebookSignIn', () => ({ signInWithFacebook: jest.fn() }));
jest.mock('@/shared/services/deviceService', () => ({ getAppVersion: () => '1.2.3' }));
jest.mock('socket.io-client', () => ({ io: jest.fn() }));
jest.mock('@/shared/utils/toast', () => ({ showError: jest.fn(), showSuccess: jest.fn() }));
jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

const fetchMock = jest.fn();
const navigate = jest.fn();
let clear: () => void = () => undefined;

function renderScreen(params?: object) {
	const props = { navigation: { navigate }, route: { params } } as unknown as Props;
	const { client } = renderWithQuery(<ResetPasswordOrchestrator {...props} />);
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

const PARAMS = { email: 'a@example.com' };

function fill(password: string, confirmation = password) {
	fireEvent.changeText(screen.getAllByDisplayValue('')[0], '123456');
	fireEvent.changeText(screen.getByPlaceholderText('Saisissez le nouveau mot de passe'), password);
	fireEvent.changeText(screen.getByPlaceholderText('Saisissez-le à nouveau'), confirmation);
}

describe('ResetPasswordOrchestrator', () => {
	it('resets the password, then goes back to the login screen', async () => {
		fetchMock.mockResolvedValue(ok({ message: 'reset' }));
		renderScreen(PARAMS);

		fill('NewSecret1');
		fireEvent.press(screen.getByLabelText('Réinitialiser le mot de passe'));

		await waitFor(() =>
			expect(showSuccess).toHaveBeenCalledWith('Mot de passe réinitialisé avec succès')
		);
		expect(request().body).toEqual({
			email: 'a@example.com',
			code: '123456',
			newPassword: 'NewSecret1',
		});
		await waitFor(() => expect(navigate).toHaveBeenCalledWith('Login'), { timeout: 3000 });
	});

	it('checks the new password before any request', () => {
		renderScreen(PARAMS);

		fill('NewSecret1', 'Other1');
		fireEvent.press(screen.getByLabelText('Réinitialiser le mot de passe'));

		expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeTruthy();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('shows the failure of a wrong code', async () => {
		fetchMock.mockResolvedValue(fail(400, 'INVALID_RESET_CODE'));
		renderScreen(PARAMS);

		fill('NewSecret1');
		fireEvent.press(screen.getByLabelText('Réinitialiser le mot de passe'));

		expect(await screen.findByText('Code de réinitialisation incorrect ou expiré')).toBeTruthy();
		expect(navigate).not.toHaveBeenCalled();
	});

	it('waits the remaining time when a code was sent recently', async () => {
		fetchMock.mockResolvedValue(ok({ canResend: false, remainingSeconds: 42 }));
		renderScreen(PARAMS);

		fireEvent.press(screen.getByLabelText('Renvoyer le code'));

		expect(await screen.findByText('Renvoyer dans 42 s')).toBeTruthy();
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(request().url).toMatch(/\/reset-password\/can-resend\?email=a%40example\.com$/);
	});

	it('sends a new code when allowed', async () => {
		fetchMock
			.mockResolvedValueOnce(ok({ canResend: true, remainingSeconds: 0 }))
			.mockResolvedValueOnce(ok({ message: 'sent' }));
		renderScreen(PARAMS);

		fireEvent.press(screen.getByLabelText('Renvoyer le code'));

		expect(await screen.findByText('Renvoyer dans 60 s')).toBeTruthy();
		expect(showSuccess).toHaveBeenCalledWith('Code renvoyé à votre email');
		expect(request(1).url).toMatch(/\/api\/auth\/forgot-password$/);
	});

	it('shows a toast and the failure when the new code cannot be sent', async () => {
		fetchMock
			.mockResolvedValueOnce(ok({ canResend: true, remainingSeconds: 0 }))
			.mockResolvedValueOnce(fail(500, 'INTERNAL_ERROR'));
		renderScreen(PARAMS);

		fireEvent.press(screen.getByLabelText('Renvoyer le code'));

		await waitFor(() => expect(showError).toHaveBeenCalledWith('Échec envoi du code. Réessayez.'));
		expect(
			await screen.findByText('Le serveur a rencontré un problème. Réessayez plus tard.')
		).toBeTruthy();
	});
});
