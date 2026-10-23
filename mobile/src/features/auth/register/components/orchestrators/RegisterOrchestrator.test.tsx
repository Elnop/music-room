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
import { RegisterOrchestrator } from './RegisterOrchestrator';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/features/auth/services/googleSignIn', () => ({ signInWithGoogle: jest.fn() }));
jest.mock('@/features/auth/services/facebookSignIn', () => ({ signInWithFacebook: jest.fn() }));
jest.mock('@/shared/services/deviceService', () => ({ getAppVersion: () => '1.2.3' }));
jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('socket.io-client', () => ({ io: jest.fn() }));
jest.mock('@/shared/utils/toast', () => ({ showError: jest.fn(), showSuccess: jest.fn() }));
jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const fetchMock = jest.fn();
const navigate = jest.fn();
const user = { id: 'user-a', email: 'a@example.com', username: 'alice' };
const session = { accessToken: 'access', refreshToken: 'refresh', expiresIn: 3600, expiresAt: 9e9 };
let clear: () => void = () => undefined;

function renderScreen(params?: object) {
	const props = { navigation: { navigate }, route: { params } } as unknown as Props;
	const { client } = renderWithQuery(<RegisterOrchestrator {...props} />);
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

function fillAndSubmit() {
	fireEvent.changeText(screen.getByPlaceholderText('vous@exemple.com'), 'new@example.com');
	fireEvent.changeText(screen.getByPlaceholderText('votre_pseudo'), 'newbie');
	fireEvent.changeText(
		screen.getByPlaceholderText('Choisissez un mot de passe robuste'),
		'Secret1!'
	);
	fireEvent.press(screen.getByLabelText('Créer un compte'));
}

describe('RegisterOrchestrator', () => {
	it('opens the code screen when the email must be verified', async () => {
		fetchMock.mockResolvedValue(
			ok({ user: { ...user, id: 'user-new' }, requiresVerification: true })
		);
		renderScreen();

		fillAndSubmit();

		await waitFor(() =>
			expect(navigate).toHaveBeenCalledWith('EmailVerification', {
				userId: 'user-new',
				email: 'new@example.com',
			})
		);
		expect(request().url).toMatch(/\/api\/auth\/register$/);
		expect(request().body).toEqual({
			email: 'new@example.com',
			password: 'Secret1!',
			username: 'newbie',
		});
		expect(useAuthStore.getState().isAuthenticated).toBe(false);
	});

	it('signs in when the backend returns a session', async () => {
		fetchMock.mockResolvedValue(ok({ user, session, requiresVerification: false }));
		renderScreen();

		fillAndSubmit();

		await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
		expect(navigate).not.toHaveBeenCalled();
	});

	it('shows a French toast when the email is taken', async () => {
		fetchMock.mockResolvedValue(fail(409, 'EMAIL_ALREADY_EXISTS'));
		renderScreen();

		fillAndSubmit();

		await waitFor(() => expect(showError).toHaveBeenCalledWith('Cet email est déjà utilisé'));
	});

	it('checks the password rules before any request', async () => {
		renderScreen();

		fireEvent.press(screen.getByLabelText('Créer un compte'));

		expect(
			await screen.findByText('Le mot de passe doit contenir au moins 8 caractères')
		).toBeTruthy();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('links to the login screen', () => {
		renderScreen();

		fireEvent.press(screen.getByText('Se connecter'));

		expect(navigate).toHaveBeenCalledWith('Login');
	});
});
