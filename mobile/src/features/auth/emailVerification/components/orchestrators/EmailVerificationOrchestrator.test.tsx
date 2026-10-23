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
import { EmailVerificationOrchestrator } from './EmailVerificationOrchestrator';

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

type Props = NativeStackScreenProps<AuthStackParamList, 'EmailVerification'>;

const fetchMock = jest.fn();
const navigate = jest.fn();
const user = { id: 'user-a', email: 'a@example.com', username: 'alice' };
const session = { accessToken: 'access', refreshToken: 'refresh', expiresIn: 3600, expiresAt: 9e9 };
let clear: () => void = () => undefined;

function renderScreen(params?: object) {
	const props = { navigation: { navigate }, route: { params } } as unknown as Props;
	const { client } = renderWithQuery(<EmailVerificationOrchestrator {...props} />);
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

const PARAMS = { userId: 'user-a', email: 'a@example.com' };

/** Pastes a whole code in the first box, as an autofill does. */
function typeCode(code: string) {
	fireEvent.changeText(screen.getAllByDisplayValue('')[0], code);
}

describe('EmailVerificationOrchestrator', () => {
	it('verifies a complete code at once and signs in', async () => {
		fetchMock.mockResolvedValue(ok({ user, session }));
		renderScreen(PARAMS);

		expect(screen.getByText('a@example.com')).toBeTruthy();
		typeCode('123456');

		await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
		expect(request().url).toMatch(/\/api\/auth\/verify-email$/);
		expect(request().body).toEqual({ userId: 'user-a', code: '123456' });
	});

	it('shows the error and empties the boxes after a wrong code', async () => {
		fetchMock.mockResolvedValue(fail(400, 'INVALID_CODE'));
		renderScreen(PARAMS);

		typeCode('123456');

		expect(await screen.findByText('Code de vérification incorrect')).toBeTruthy();
		expect(screen.getAllByDisplayValue('')).toHaveLength(6);
		expect(screen.getByLabelText('Vérifier')).toBeDisabled();
	});

	it('sends a new code, then waits before the next one', async () => {
		fetchMock.mockResolvedValue(ok({ message: 'sent' }));
		renderScreen(PARAMS);

		fireEvent.press(screen.getByLabelText('Renvoyer le code'));

		expect(await screen.findByText('Renvoyer dans 60 s')).toBeTruthy();
		expect(showSuccess).toHaveBeenCalledWith('Code renvoyé. Vérifiez votre email.');
		expect(request().url).toMatch(/\/api\/auth\/resend-verification$/);
		expect(request().body).toEqual(PARAMS);
	});

	it('shows why a new code could not be sent', async () => {
		fetchMock.mockResolvedValue(fail(429, 'RESEND_COOLDOWN'));
		renderScreen(PARAMS);

		fireEvent.press(screen.getByLabelText('Renvoyer le code'));

		expect(
			await screen.findByText('Patientez un instant avant de redemander un code.')
		).toBeTruthy();
		expect(screen.getByText('Renvoyer le code')).toBeTruthy();
	});

	it('goes back to the login screen', () => {
		renderScreen(PARAMS);

		fireEvent.press(screen.getByLabelText('Retour à la connexion'));

		expect(navigate).toHaveBeenCalledWith('Login');
	});
});
