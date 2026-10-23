import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/shared/query/queryClient';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { resetBackendUrl } from '@/shared/services/backendUrl';
import { signInWithGoogle } from '@/features/auth/services/googleSignIn';
import { signInWithFacebook } from '@/features/auth/services/facebookSignIn';
import { showError, showSuccess } from '@/shared/utils/toast';
import { LinkedAccountsScreen } from './LinkedAccountsScreen';
import { logger } from '@/shared/utils/logger';
import type { UserProfile } from '@/types/user.types';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/features/player/context/PlayerContext', () => ({
	usePlayerHeight: () => 0,
}));

jest.mock('@/features/auth/services/googleSignIn', () => ({ signInWithGoogle: jest.fn() }));
jest.mock('@/features/auth/services/facebookSignIn', () => ({ signInWithFacebook: jest.fn() }));

jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('socket.io-client', () => ({ io: jest.fn() }));

jest.mock('@/shared/utils/toast', () => ({
	showError: jest.fn(),
	showSuccess: jest.fn(),
}));

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/shared/components/ui/LoadingSpinner', () => ({
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

let queryClient: QueryClient;

/**
 * Renders with the app's own client defaults (createQueryClient). Pass the
 * client of an earlier render to revisit the screen with its cache.
 */
function renderScreen(client: QueryClient = createQueryClient()) {
	queryClient = client;
	return render(
		<QueryClientProvider client={client}>
			<LinkedAccountsScreen />
		</QueryClientProvider>
	);
}

async function renderLoaded(): Promise<void> {
	renderScreen();
	await screen.findByTestId('linked-account-password', {}, FIRST_RENDER);
}

beforeEach(async () => {
	jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	globalThis.fetch = fetchMock as unknown as typeof fetch;
	fetchMock.mockReset();
	mockedGoogle.mockReset();
	mockedFacebook.mockReset();
	(showError as jest.Mock).mockReset();
	(showSuccess as jest.Mock).mockReset();
	await AsyncStorage.clear();
	await resetBackendUrl();
	useAuthStore.setState({
		user: { id: 'me' } as UserProfile,
		accessToken: 'access',
		refreshToken: 'refresh',
		tokenExpiresAt: Date.now() + 3600_000,
		isAuthenticated: true,
		isRefreshing: false,
		isLoading: false,
	});
});

afterEach(() => {
	queryClient?.clear();
	jest.restoreAllMocks();
});

describe('LinkedAccountsScreen', () => {
	it('lists each sign-in method with its state', async () => {
		fetchMock.mockResolvedValueOnce(ok({ providers: [password, google] }));

		await renderLoaded();

		expect(requests()[0]).toMatchObject({ method: 'GET' });
		expect(requests()[0].url).toMatch(/\/api\/auth\/providers$/);
		expect(screen.getByTestId('linked-account-password')).toHaveTextContent(/Lié · Principal/);
		expect(screen.getByLabelText('Délier Google')).toBeTruthy();
		expect(screen.getByLabelText('Lier Facebook')).toBeTruthy();
		expect(screen.queryByLabelText(/Lier Email|Délier Email/)).toBeNull();
	});

	it('shows an error toast and no rows when loading fails', async () => {
		fetchMock.mockResolvedValueOnce(fail(500, 'INTERNAL_ERROR', 'Server exploded'));

		renderScreen();

		await screen.findByText('Impossible de charger les comptes liés', {}, FIRST_RENDER);
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
		fireEvent.press(screen.getByLabelText('Lier Google'));

		await screen.findByLabelText('Délier Google');
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
		fireEvent.press(screen.getByLabelText('Lier Facebook'));

		await screen.findByLabelText('Délier Facebook');
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
		fireEvent.press(screen.getByLabelText('Lier Google'));

		await waitFor(() => expect(screen.getByLabelText('Lier Google')).toBeEnabled());
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(showError).not.toHaveBeenCalled();
		expect(showSuccess).not.toHaveBeenCalled();
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
		fireEvent.press(screen.getByLabelText('Lier Google'));

		await waitFor(() => expect(showError).toHaveBeenCalledWith(message));
		expect(screen.getByLabelText('Lier Google')).toBeTruthy();
		expect(showSuccess).not.toHaveBeenCalled();
	});

	it('unlinks Google, refetches the list and shows a success toast', async () => {
		fetchMock
			.mockResolvedValueOnce(ok({ providers: [password, google] }))
			.mockResolvedValueOnce(ok({ message: 'google unlinked successfully' }))
			.mockResolvedValueOnce(ok({ providers: [password] }));

		await renderLoaded();
		fireEvent.press(screen.getByLabelText('Délier Google'));

		await screen.findByLabelText('Lier Google');
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
		fireEvent.press(screen.getByLabelText('Délier Google'));

		await waitFor(() => expect(showError).toHaveBeenCalledWith(message));
		expect(screen.getByLabelText('Délier Google')).toBeTruthy();
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
		fireEvent.press(screen.getByLabelText('Lier Google'));

		await waitFor(() => expect(screen.getByLabelText('Lier Facebook')).toBeDisabled());
		expect(screen.getByLabelText('Lier Google')).toBeDisabled();

		finishSignIn('google-id-token');
		await screen.findByLabelText('Délier Google');
		expect(screen.getByLabelText('Lier Facebook')).toBeEnabled();
	});

	it('refetches on every visit, showing the cached list meanwhile', async () => {
		fetchMock
			.mockResolvedValueOnce(ok({ providers: [password] }))
			.mockResolvedValueOnce(ok({ providers: [password, google] }));
		const first = renderScreen();
		await screen.findByTestId('linked-account-password', {}, FIRST_RENDER);
		first.unmount();

		renderScreen(queryClient);

		expect(screen.getByLabelText('Lier Google')).toBeTruthy();
		await screen.findByLabelText('Délier Google');
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('shows one toast per failed fetch, without retry, and never replays it', async () => {
		fetchMock
			.mockResolvedValueOnce(fail(500, 'INTERNAL_ERROR', 'Server exploded'))
			.mockResolvedValueOnce(ok({ providers: [password] }));
		const first = renderScreen();
		await screen.findByText('Impossible de charger les comptes liés', {}, FIRST_RENDER);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(showError).toHaveBeenCalledTimes(1);
		first.unmount();

		renderScreen(queryClient);

		await screen.findByTestId('linked-account-password');
		expect(showError).toHaveBeenCalledTimes(1);
	});

	it('keeps the list when a refetch fails on a revisit', async () => {
		fetchMock
			.mockResolvedValueOnce(ok({ providers: [password, google] }))
			.mockResolvedValueOnce(fail(500, 'INTERNAL_ERROR', 'Server exploded'));
		const first = renderScreen();
		await screen.findByLabelText('Délier Google', {}, FIRST_RENDER);
		first.unmount();

		renderScreen(queryClient);

		await waitFor(() => expect(showError).toHaveBeenCalledTimes(1));
		expect(screen.getByLabelText('Délier Google')).toBeTruthy();
	});

	it('reports the unlink as failed when the refetch after it fails', async () => {
		fetchMock
			.mockResolvedValueOnce(ok({ providers: [password, google] }))
			.mockResolvedValueOnce(ok({ message: 'google unlinked successfully' }))
			.mockRejectedValueOnce(new TypeError('Network request failed'));

		await renderLoaded();
		fireEvent.press(screen.getByLabelText('Délier Google'));

		await waitFor(() =>
			expect(showError).toHaveBeenCalledWith(
				'Impossible de joindre le serveur. Vérifiez votre connexion.'
			)
		);
		expect(showSuccess).not.toHaveBeenCalled();
		expect(fetchMock).toHaveBeenCalledTimes(3);
	});
});
