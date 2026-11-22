import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { QueryClientProvider } from '@tanstack/react-query';
import { LoginContainer } from '@/features/user/features/auth/features/login/components/LoginContainer';
import { authStore } from '@/features/user/features/auth/shared/sign-in/authStore';
import { signInWithGoogle } from '@/features/user/features/auth/shared/sign-in/lib/googleSignIn';
import { signInWithFacebook } from '@/features/user/features/auth/shared/sign-in/lib/facebookSignIn';
import type { AuthStackParamList } from '@/features/user/features/auth/authTypes';
import { resetBackendUrl } from '@/shared/backend/lib/backendUrl';
import { showError, showWarning } from '@/shared/theme/lib/toast';
import { logger } from '@/shared/logging/logger';
import { renderWithQuery } from '@test-utils/renderWithQuery';
import { fail, ok } from '@test-utils/fetchResponses';
import { noop } from '@test-utils/noop';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/features/user/features/auth/shared/sign-in/lib/googleSignIn', () => ({
	signInWithGoogle: jest.fn(),
}));
jest.mock('@/features/user/features/auth/shared/sign-in/lib/facebookSignIn', () => ({
	signInWithFacebook: jest.fn(),
}));
jest.mock('@/shared/backend/deviceService', () => ({ getAppVersion: () => '1.2.3' }));
jest.mock('socket.io-client', () => ({ io: jest.fn() }));
jest.mock('@/shared/theme/lib/toast', () => ({ showError: jest.fn(), showWarning: jest.fn() }));
let mockFocused = true;
jest.mock('@react-navigation/native', () => ({ useIsFocused: () => mockFocused }));
jest.mock('@/shared/theme/hooks/useTheme', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/configs/originalThemeConfig');
	return { useTheme: () => ({ theme: originalTheme }) };
});

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const fetchMock = jest.fn();
const navigate = jest.fn();
const user = { id: 'user-a', email: 'a@example.com', username: 'alice' };
const session = { accessToken: 'access', refreshToken: 'refresh', expiresIn: 3600, expiresAt: 9e9 };

function renderLogin() {
	const props = { navigation: { navigate }, route: {} } as unknown as Props;
	const view = renderWithQuery(<LoginContainer {...props} />);
	clear = () => view.client.clear();
	function setFocused(focused: boolean) {
		mockFocused = focused;
		view.rerender(
			<QueryClientProvider client={view.client}>
				<LoginContainer {...props} />
			</QueryClientProvider>,
		);
	}
	return { ...view, setFocused };
}

function fillAndSubmit(email: string, password: string) {
	fireEvent.changeText(screen.getByPlaceholderText('demo@zumik.com'), email);
	fireEvent.changeText(screen.getByPlaceholderText('Saisissez votre mot de passe'), password);
	fireEvent.press(screen.getByLabelText('Se connecter'));
}

let clear: () => void = noop;

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
	authStore.setState({ user: null, accessToken: null, isAuthenticated: false });
});

afterEach(() => {
	clear();
	jest.restoreAllMocks();
});

describe('LoginContainer', () => {
	it('signs in with the email and password', async () => {
		fetchMock.mockResolvedValue(ok({ user, session }));
		renderLogin();

		fillAndSubmit('a@example.com', 'Secret1!');

		await waitFor(() => expect(authStore.getState().isAuthenticated).toBe(true));
		expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/auth\/login$/u);
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
		expect(authStore.getState().isAuthenticated).toBe(false);
	});

	it('sends an unverified account to the code screen', async () => {
		const details = { userId: 'user-a', email: 'a@example.com' };
		fetchMock.mockResolvedValue(fail(403, 'EMAIL_NOT_VERIFIED', 'Not verified', details));
		renderLogin();

		fillAndSubmit('a@example.com', 'Secret1!');
		await waitFor(() =>
			expect(showWarning).toHaveBeenCalledWith('Email non vérifié. Redirection...'),
		);
		expect(navigate).not.toHaveBeenCalled();

		await waitFor(() => expect(navigate).toHaveBeenCalledWith('EmailVerification', details), {
			timeout: 3000,
		});
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

		await waitFor(() => expect(authStore.getState().isAuthenticated).toBe(true));
		expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/auth\/google$/u);
	});

	it('shows nothing when the Facebook sign-in is cancelled', async () => {
		jest.mocked(signInWithFacebook).mockRejectedValue(new Error('SIGN_IN_CANCELLED'));
		renderLogin();

		fireEvent.press(screen.getByLabelText('Continuer avec Facebook'));

		await waitFor(() => expect(signInWithFacebook).toHaveBeenCalledWith());
		await waitFor(() => expect(screen.getByLabelText('Continuer avec Facebook')).toBeEnabled());
		expect(showError).not.toHaveBeenCalled();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('shows a French toast when Facebook is not configured', async () => {
		jest.mocked(signInWithFacebook).mockRejectedValue(new Error('Facebook App ID not configured.'));
		renderLogin();

		fireEvent.press(screen.getByLabelText('Continuer avec Facebook'));

		await waitFor(() =>
			expect(showError).toHaveBeenCalledWith("La connexion avec Facebook n'est pas configurée."),
		);
	});

	it('waits until the screen is focused again to show the error toast', async () => {
		fetchMock.mockResolvedValue(fail(401, 'INVALID_CREDENTIALS'));
		const view = renderLogin();

		fillAndSubmit('a@example.com', 'wrong');
		view.setFocused(false);
		await waitFor(() =>
			expect(fetchMock).toHaveBeenCalledWith(
				expect.stringMatching(/\/api\/auth\/login$/u),
				expect.anything(),
			),
		);
		await new Promise<void>((resolve) => setTimeout(resolve, 50));
		expect(showError).not.toHaveBeenCalled();

		view.setFocused(true);

		await waitFor(() => expect(showError).toHaveBeenCalledWith('Email ou mot de passe incorrect'));
	});

	it('shows no error toast once the screen has unmounted', async () => {
		let answer: (response: Response) => void = noop;
		fetchMock.mockReturnValue(new Promise<Response>((resolve) => (answer = resolve)));
		const view = renderLogin();

		fillAndSubmit('a@example.com', 'wrong');
		await waitFor(() =>
			expect(fetchMock).toHaveBeenCalledWith(
				expect.stringMatching(/\/api\/auth\/login$/u),
				expect.anything(),
			),
		);
		view.unmount();
		answer(fail(401, 'INVALID_CREDENTIALS'));
		await new Promise<void>((resolve) => setTimeout(resolve, 50));

		expect(showError).not.toHaveBeenCalled();
	});
});
