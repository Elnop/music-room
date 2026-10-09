import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@store/authStore';
import { resetBackendUrl } from '@/services/backendUrl';

const mockSupabaseAuth = {
	signOut: jest.fn(),
	setSession: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Getter: the factory runs before this module's constants are initialised.
jest.mock('@/lib/supabase', () => ({
	supabase: {
		get auth() {
			return mockSupabaseAuth;
		},
	},
}));

jest.mock('@services/oauth', () => ({
	signInWithGoogle: jest.fn(),
	signInWithFacebook: jest.fn(),
}));

jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

const fetchMock = jest.fn();

function jsonResponse(status: number, body: object): Response {
	return {
		ok: status >= 200 && status < 300,
		status,
		statusText: '',
		json: () => Promise.resolve(body),
		text: () => Promise.resolve(JSON.stringify(body)),
	} as unknown as Response;
}

const user = {
	id: 'user-a',
	email: 'a@example.com',
	username: 'alice',
	createdAt: '2025-01-01T00:00:00Z',
	updatedAt: '2025-01-01T00:00:00Z',
};

async function signedIn(): Promise<void> {
	useAuthStore.setState({
		user,
		accessToken: 'old-access',
		refreshToken: 'old-refresh',
		tokenExpiresAt: Date.now() - 1000,
		isAuthenticated: true,
		isRefreshing: false,
	});
	await useAuthStore.getState().saveToStorage();
}

function calledUrls(): string[] {
	return fetchMock.mock.calls.map(([url]) => url as string);
}

beforeEach(async () => {
	jest.spyOn(console, 'log').mockImplementation(() => undefined);
	jest.spyOn(console, 'warn').mockImplementation(() => undefined);
	jest.spyOn(console, 'error').mockImplementation(() => undefined);
	globalThis.fetch = fetchMock as unknown as typeof fetch;
	fetchMock.mockReset();
	mockSupabaseAuth.signOut.mockReset().mockResolvedValue({ error: null });
	mockSupabaseAuth.setSession.mockReset().mockResolvedValue({ data: {}, error: null });
	await AsyncStorage.clear();
	await resetBackendUrl();
	await signedIn();
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('refreshAccessToken', () => {
	it('ends the session locally when the refresh token is refused (401)', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(401, {
				success: false,
				error: { message: 'Invalid or expired refresh token', code: 'INVALID_REFRESH_TOKEN' },
			})
		);

		await expect(useAuthStore.getState().refreshAccessToken()).resolves.toBe(false);

		expect(useAuthStore.getState()).toMatchObject({
			user: null,
			accessToken: null,
			refreshToken: null,
			isAuthenticated: false,
			isRefreshing: false,
		});
		expect(await AsyncStorage.getItem('@zumik/access_token')).toBeNull();
		expect(await AsyncStorage.getItem('@zumik/refresh_token')).toBeNull();
		expect(await AsyncStorage.getItem('@zumik/is_authenticated')).toBeNull();
		expect(mockSupabaseAuth.signOut).toHaveBeenCalledWith({ scope: 'local' });
		expect(calledUrls()).toHaveLength(1);
		expect(calledUrls()[0]).toMatch(/\/api\/auth\/refresh$/);
		expect(calledUrls().some(url => url.endsWith('/api/auth/logout'))).toBe(false);
	});

	it('keeps the session when the auth service is unavailable (503)', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(503, {
				success: false,
				error: { message: 'Authentication service is unavailable', code: 'AUTH_UNAVAILABLE' },
			})
		);

		await expect(useAuthStore.getState().refreshAccessToken()).resolves.toBe(false);

		expect(useAuthStore.getState()).toMatchObject({
			accessToken: 'old-access',
			refreshToken: 'old-refresh',
			isAuthenticated: true,
			isRefreshing: false,
		});
		expect(await AsyncStorage.getItem('@zumik/refresh_token')).toBe('old-refresh');
		expect(mockSupabaseAuth.signOut).not.toHaveBeenCalled();
	});

	it('ends the session locally without any request when there is no refresh token', async () => {
		// Expiring access token, no refresh token (a session restored from storage).
		useAuthStore.setState({ refreshToken: null });

		await expect(useAuthStore.getState().refreshAccessToken()).resolves.toBe(false);

		expect(useAuthStore.getState()).toMatchObject({
			user: null,
			accessToken: null,
			isAuthenticated: false,
		});
		expect(await AsyncStorage.getItem('@zumik/access_token')).toBeNull();
		expect(mockSupabaseAuth.signOut).toHaveBeenCalledWith({ scope: 'local' });
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('keeps the session when the backend is unreachable', async () => {
		fetchMock.mockRejectedValue(new TypeError('Network request failed'));

		await expect(useAuthStore.getState().refreshAccessToken()).resolves.toBe(false);

		expect(useAuthStore.getState()).toMatchObject({
			accessToken: 'old-access',
			refreshToken: 'old-refresh',
			isAuthenticated: true,
		});
		expect(await AsyncStorage.getItem('@zumik/access_token')).toBe('old-access');
		expect(mockSupabaseAuth.signOut).not.toHaveBeenCalled();
	});

	it('stores the new tokens on success', async () => {
		const expiresAt = Math.floor(Date.now() / 1000) + 3600;
		fetchMock.mockResolvedValue(
			jsonResponse(200, {
				success: true,
				data: {
					user,
					session: {
						accessToken: 'new-access',
						refreshToken: 'new-refresh',
						expiresIn: 3600,
						expiresAt,
					},
				},
			})
		);

		await expect(useAuthStore.getState().refreshAccessToken()).resolves.toBe(true);

		expect(useAuthStore.getState()).toMatchObject({
			accessToken: 'new-access',
			refreshToken: 'new-refresh',
			tokenExpiresAt: expiresAt * 1000,
			isAuthenticated: true,
		});
		expect(await AsyncStorage.getItem('@zumik/refresh_token')).toBe('new-refresh');
		expect(mockSupabaseAuth.setSession).toHaveBeenCalledWith({
			access_token: 'new-access',
			refresh_token: 'new-refresh',
		});
	});
});
