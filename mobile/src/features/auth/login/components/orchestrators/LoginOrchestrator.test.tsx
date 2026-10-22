import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { QueryClientProvider } from '@tanstack/react-query';
import { LoginOrchestrator } from './LoginOrchestrator';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { signInWithGoogle } from '@/features/auth/services/googleSignIn';
import { signInWithFacebook } from '@/features/auth/services/facebookSignIn';
import type { AuthStackParamList } from '@/features/auth/types';
import { resetBackendUrl } from '@/shared/services/backendUrl';
import { showError, showWarning } from '@/shared/utils/toast';
import { logger } from '@/shared/utils/logger';
import { renderWithQuery } from '@/test/renderWithQuery';
import { fail, ok } from '@/test/fetchResponses';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/features/auth/services/googleSignIn', () => ({ signInWithGoogle: jest.fn() }));
jest.mock('@/features/auth/services/facebookSignIn', () => ({ signInWithFacebook: jest.fn() }));
jest.mock('@/services/deviceService', () => ({ getAppVersion: () => '1.2.3' }));
jest.mock('socket.io-client', () => ({ io: jest.fn() }));
jest.mock('@/shared/utils/toast', () => ({ showError: jest.fn(), showWarning: jest.fn() }));
let mockFocused = true;
jest.mock('@react-navigation/native', () => ({ useIsFocused: () => mockFocused }));
jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const fetchMock = jest.fn();
const navigate = jest.fn();
const user = { id: 'user-a', email: 'a@example.com', username: 'alice' };
const session = { accessToken: 'access', refreshToken: 'refresh', expiresIn: 3600, expiresAt: 9e9 };

function renderLogin() {
	const props = { navigation: { navigate }, route: {} } as unknown as Props;
	const view = renderWithQuery(<LoginOrchestrator {...props} />);
	clear = () => view.client.clear();
	/** Another screen goes on top (false) or leaves (true). */
	const setFocused = (focused: boolean) => {
		mockFocused = focused;
		view.rerender(
			<QueryClientProvider client={view.client}>
				<LoginOrchestrator {...props} />
			</QueryClientProvider>
		);
	};
	return { ...view, setFocused };
}

function fillAndSubmit(email: string, password: string) {
	fireEvent.changeText(screen.getByPlaceholderText('demo@zumik.com'), email);
	fireEvent.changeText(screen.getByPlaceholderText('Saisissez votre mot de passe'), password);
	fireEvent.press(screen.getByLabelText('Se connecter'));
}

let clear: () => void = () => undefined;

beforeEach(async () => {
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	globalThis.fetch = fetchMock as unknown as typeof fetch;
	fetchMock.mockReset();
	navigate.mockReset();
	mockFocused = true;
	jest.mocked(showError).mockReset();
	jest.mocked(showWarning).mockReset();
	jest.mocked(signInWithGoogle).mockReset();
	jest.mocked(signInWithFacebook).mockReset();
	await AsyncStorage.clear();
	await resetBackendUrl();
	useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false });
});

afterEach(() => {
	clear();
	jest.restoreAllMocks();
});

describe('LoginOrchestrator', () => {
	it('signs in with the email and password', async () => {
		fetchMock.mockResolvedValue(ok({ user, session }));
		renderLogin();

		fillAndSubmit('a@example.com', 'Secret1!');

		await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
		expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/auth\/login$/);
		expect(showError).not.toHaveBeenCalled();
	});

	it('shows the form errors without calling the backend', async () => {
		renderLogin();

		fillAndSubmit('not-an-email', '');

		expect(await screen.findByText('Le mot de passe est requis')).toBeTruthy();
		expect(screen.getByText("Format d'email invalide")).toBeTruthy();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('shows a French toast when the password is wrong', async () => {
		fetchMock.mockResolvedValue(fail(401, 'INVALID_CREDENTIALS'));
		renderLogin();

		fillAndSubmit('a@example.com', 'wrong');

		await waitFor(() => expect(showError).toHaveBeenCalledWith('Email ou mot de passe incorrect'));
		expect(useAuthStore.getState().isAuthenticated).toBe(false);
	});

	it('sends an unverified account to the code screen', async () => {
		const details = { userId: 'user-a', email: 'a@example.com' };
		fetchMock.mockResolvedValue(fail(403, 'EMAIL_NOT_VERIFIED', 'Not verified', details));
		renderLogin();

		fillAndSubmit('a@example.com', 'Secret1!');
		await waitFor(() =>
			expect(showWarning).toHaveBeenCalledWith('Email non vérifié. Redirection...')
		);
		expect(navigate).not.toHaveBeenCalled();

		await waitFor(() => expect(navigate).toHaveBeenCalled(), { timeout: 3000 });
		expect(navigate).toHaveBeenCalledWith('EmailVerification', details);
		expect(showError).not.toHaveBeenCalled();
	});

	it('opens the forgotten password screen with the typed email', () => {
		renderLogin();

		fireEvent.changeText(screen.getByPlaceholderText('demo@zumik.com'), ' a@example.com ');
		fireEvent.press(screen.getByLabelText('Mot de passe oublié ?'));
		fireEvent.press(screen.getByText("S'inscrire"));

		expect(navigate).toHaveBeenCalledWith('ForgotPassword', { email: 'a@example.com' });
		expect(navigate).toHaveBeenCalledWith('Register');
	});

	it('signs in with Google', async () => {
		jest.mocked(signInWithGoogle).mockResolvedValue('google-id-token');
		fetchMock.mockResolvedValue(ok({ user, session }));
		renderLogin();

		fireEvent.press(screen.getByLabelText('Continuer avec Google'));

		await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
		expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/auth\/google$/);
	});

	it('shows nothing when the Facebook sign-in is cancelled', async () => {
		jest.mocked(signInWithFacebook).mockRejectedValue(new Error('SIGN_IN_CANCELLED'));
		renderLogin();

		fireEvent.press(screen.getByLabelText('Continuer avec Facebook'));

		await waitFor(() => expect(signInWithFacebook).toHaveBeenCalled());
		await waitFor(() => expect(screen.getByLabelText('Continuer avec Facebook')).toBeEnabled());
		expect(showError).not.toHaveBeenCalled();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('shows a French toast when Facebook is not configured', async () => {
		jest.mocked(signInWithFacebook).mockRejectedValue(new Error('Facebook App ID not configured.'));
		renderLogin();

		fireEvent.press(screen.getByLabelText('Continuer avec Facebook'));

		await waitFor(() =>
			expect(showError).toHaveBeenCalledWith("La connexion avec Facebook n'est pas configurée.")
		);
	});

	it('waits until the screen is focused again to show the error toast', async () => {
		fetchMock.mockResolvedValue(fail(401, 'INVALID_CREDENTIALS'));
		const view = renderLogin();

		fillAndSubmit('a@example.com', 'wrong');
		view.setFocused(false);
		await waitFor(() => expect(fetchMock).toHaveBeenCalled());
		await new Promise<void>(resolve => setTimeout(resolve, 50));
		expect(showError).not.toHaveBeenCalled();

		view.setFocused(true);

		await waitFor(() => expect(showError).toHaveBeenCalledWith('Email ou mot de passe incorrect'));
	});

	it('shows no error toast once the screen has unmounted', async () => {
		let answer: (response: Response) => void = () => undefined;
		fetchMock.mockReturnValue(new Promise<Response>(resolve => (answer = resolve)));
		const view = renderLogin();

		fillAndSubmit('a@example.com', 'wrong');
		await waitFor(() => expect(fetchMock).toHaveBeenCalled());
		view.unmount();
		answer(fail(401, 'INVALID_CREDENTIALS'));
		await new Promise<void>(resolve => setTimeout(resolve, 50));

		expect(showError).not.toHaveBeenCalled();
	});
});
