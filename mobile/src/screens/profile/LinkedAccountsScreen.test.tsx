import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useAuthStore } from '@store/authStore';
import { resetBackendUrl } from '@/services/backendUrl';
import { signInWithGoogle, signInWithFacebook } from '@services/oauth';
import { showError, showSuccess } from '@utils/toast';
import { LinkedAccountsScreen } from '@/screens/profile/LinkedAccountsScreen';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/contexts/PlayerContext', () => ({
	usePlayerHeight: () => 0,
}));

jest.mock('@/lib/supabase', () => ({
	supabase: { auth: { signOut: jest.fn(), setSession: jest.fn() } },
}));

jest.mock('@services/oauth', () => ({
	signInWithGoogle: jest.fn(),
	signInWithFacebook: jest.fn(),
}));

jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('socket.io-client', () => ({ io: jest.fn() }));

jest.mock('@utils/toast', () => ({
	showError: jest.fn(),
	showSuccess: jest.fn(),
}));

jest.mock('@/contexts/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@themes/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@components/common/LoadingSpinner', () => ({
	LoadingSpinner: () => null,
}));

const fetchMock = jest.fn();
const mockedGoogle = signInWithGoogle as jest.MockedFunction<typeof signInWithGoogle>;
const mockedFacebook = signInWithFacebook as jest.MockedFunction<typeof signInWithFacebook>;

function jsonResponse(status: number, body: object): Response {
	return {
		ok: status >= 200 && status < 300,
		status,
		statusText: '',
		json: () => Promise.resolve(body),
		text: () => Promise.resolve(JSON.stringify(body)),
	} as unknown as Response;
}

const ok = (data: object) => jsonResponse(200, { success: true, data });
const fail = (status: number, code: string, message: string) =>
	jsonResponse(status, { success: false, error: { code, message } });

const password = { type: 'password', connectedAt: '2025-01-01T00:00:00Z', isPrimary: true };
const google = { type: 'google', connectedAt: '2025-02-01T00:00:00Z', isPrimary: false };
const facebook = { type: 'facebook', connectedAt: '2025-03-01T00:00:00Z', isPrimary: false };

function requests(): { url: string; method: string; body?: unknown }[] {
	return fetchMock.mock.calls.map(([url, init]) => ({
		url: url as string,
		method: (init as RequestInit).method ?? 'GET',
		body: (init as RequestInit).body ? JSON.parse((init as RequestInit).body as string) : undefined,
	}));
}

// Generous timeout: the first render transforms lazily-required modules on a cold cache (CI).
const FIRST_RENDER = { timeout: 15_000 };
// Above FIRST_RENDER: the whole test must outlive a slow first render.
jest.setTimeout(20_000);

async function renderLoaded(): Promise<void> {
	render(<LinkedAccountsScreen />);
	await screen.findByTestId('linked-account-password', {}, FIRST_RENDER);
}

beforeEach(async () => {
	jest.spyOn(console, 'log').mockImplementation(() => undefined);
	jest.spyOn(console, 'warn').mockImplementation(() => undefined);
	jest.spyOn(console, 'error').mockImplementation(() => undefined);
	globalThis.fetch = fetchMock as unknown as typeof fetch;
	fetchMock.mockReset();
	mockedGoogle.mockReset();
	mockedFacebook.mockReset();
	(showError as jest.Mock).mockReset();
	(showSuccess as jest.Mock).mockReset();
	await AsyncStorage.clear();
	await resetBackendUrl();
	useAuthStore.setState({
		accessToken: 'access',
		refreshToken: 'refresh',
		tokenExpiresAt: Date.now() + 3600_000,
		isAuthenticated: true,
		isRefreshing: false,
		isLoading: false,
		linkedProviders: null,
	});
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('LinkedAccountsScreen', () => {
	it('lists each sign-in method with its state', async () => {
		fetchMock.mockResolvedValueOnce(ok({ providers: [password, google] }));

		await renderLoaded();

		expect(requests()[0]).toMatchObject({ method: 'GET' });
		expect(requests()[0].url).toMatch(/\/api\/auth\/providers$/);
		expect(screen.getByTestId('linked-account-password')).toHaveTextContent(/Linked · Primary/);
		expect(screen.getByLabelText('Unlink Google')).toBeTruthy();
		expect(screen.getByLabelText('Link Facebook')).toBeTruthy();
		expect(screen.queryByLabelText(/Link Email|Unlink Email/)).toBeNull();
	});

	it('shows an error toast and no rows when loading fails', async () => {
		fetchMock.mockResolvedValueOnce(fail(500, 'INTERNAL_ERROR', 'Server exploded'));

		render(<LinkedAccountsScreen />);

		await screen.findByText('Unable to load linked accounts', {}, FIRST_RENDER);
		expect(showError).toHaveBeenCalledWith(
			'Le serveur a rencontré un problème. Réessayez plus tard.'
		);
		expect(screen.queryByTestId('linked-account-password')).toBeNull();
	});

	it('links Google with the native ID token and shows the returned list', async () => {
		fetchMock
			.mockResolvedValueOnce(ok({ providers: [password] }))
			.mockResolvedValueOnce(ok({ providers: [password, google] }));
		mockedGoogle.mockResolvedValue('google-id-token');

		await renderLoaded();
		fireEvent.press(screen.getByLabelText('Link Google'));

		await screen.findByLabelText('Unlink Google');
		expect(requests()[1]).toMatchObject({
			method: 'POST',
			body: { idToken: 'google-id-token' },
		});
		expect(requests()[1].url).toMatch(/\/api\/auth\/providers\/google\/link$/);
		expect(showSuccess).toHaveBeenCalledWith('Compte Google lié');
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('links Facebook with the native access token', async () => {
		fetchMock
			.mockResolvedValueOnce(ok({ providers: [password] }))
			.mockResolvedValueOnce(ok({ providers: [password, facebook] }));
		mockedFacebook.mockResolvedValue('fb-access-token');

		await renderLoaded();
		fireEvent.press(screen.getByLabelText('Link Facebook'));

		await screen.findByLabelText('Unlink Facebook');
		expect(requests()[1]).toMatchObject({
			method: 'POST',
			body: { accessToken: 'fb-access-token' },
		});
		expect(requests()[1].url).toMatch(/\/api\/auth\/providers\/facebook\/link$/);
	});

	it('does nothing when the native sign-in is cancelled', async () => {
		fetchMock.mockResolvedValueOnce(ok({ providers: [password] }));
		mockedGoogle.mockRejectedValue(new Error('SIGN_IN_CANCELLED'));

		await renderLoaded();
		fireEvent.press(screen.getByLabelText('Link Google'));

		await waitFor(() => expect(screen.getByLabelText('Link Google')).toBeEnabled());
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(showError).not.toHaveBeenCalled();
		expect(showSuccess).not.toHaveBeenCalled();
		expect(useAuthStore.getState().error).toBeNull();
	});

	it.each([
		[409, 'PROVIDER_ALREADY_LINKED', 'Ce compte est déjà lié à un autre utilisateur'],
		[400, 'INVALID_PROVIDER_TOKEN', 'La connexion au service a échoué, réessayez'],
	])('keeps the list and shows a French message on %i %s', async (status, code, message) => {
		fetchMock
			.mockResolvedValueOnce(ok({ providers: [password] }))
			.mockResolvedValueOnce(fail(status, code, 'English backend message'));
		mockedGoogle.mockResolvedValue('google-id-token');

		await renderLoaded();
		fireEvent.press(screen.getByLabelText('Link Google'));

		await waitFor(() => expect(showError).toHaveBeenCalledWith(message));
		expect(screen.getByLabelText('Link Google')).toBeTruthy();
		expect(showSuccess).not.toHaveBeenCalled();
	});

	it('unlinks Google, refetches the list and shows a success toast', async () => {
		fetchMock
			.mockResolvedValueOnce(ok({ providers: [password, google] }))
			.mockResolvedValueOnce(ok({ message: 'google unlinked successfully' }))
			.mockResolvedValueOnce(ok({ providers: [password] }));

		await renderLoaded();
		fireEvent.press(screen.getByLabelText('Unlink Google'));

		await screen.findByLabelText('Link Google');
		expect(requests()[1]).toMatchObject({ method: 'DELETE' });
		expect(requests()[1].url).toMatch(/\/api\/auth\/providers\/google$/);
		expect(requests()[2]).toMatchObject({ method: 'GET' });
		expect(showSuccess).toHaveBeenCalledWith('Compte Google délié');
	});

	it('keeps the list and shows a French message when unlinking the last method', async () => {
		const message = 'Impossible de retirer votre dernière méthode de connexion';
		fetchMock
			.mockResolvedValueOnce(ok({ providers: [google] }))
			.mockResolvedValueOnce(
				fail(400, 'LAST_PROVIDER', 'Cannot unlink the last authentication method')
			);

		await renderLoaded();
		fireEvent.press(screen.getByLabelText('Unlink Google'));

		await waitFor(() => expect(showError).toHaveBeenCalledWith(message));
		expect(screen.getByLabelText('Unlink Google')).toBeTruthy();
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('disables every action while a link is running', async () => {
		fetchMock.mockResolvedValueOnce(ok({ providers: [password] }));
		let finishSignIn: (token: string) => void = () => undefined;
		mockedGoogle.mockReturnValue(
			new Promise<string>(resolve => {
				finishSignIn = resolve;
			})
		);
		fetchMock.mockResolvedValueOnce(ok({ providers: [password, google] }));

		await renderLoaded();
		fireEvent.press(screen.getByLabelText('Link Google'));

		await waitFor(() => expect(screen.getByLabelText('Link Facebook')).toBeDisabled());
		expect(screen.getByLabelText('Link Google')).toBeDisabled();

		finishSignIn('google-id-token');
		await screen.findByLabelText('Unlink Google');
		expect(screen.getByLabelText('Link Facebook')).toBeEnabled();
	});
});
