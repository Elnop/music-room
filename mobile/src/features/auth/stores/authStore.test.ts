import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from './authStore';
import { useSocketStore } from '@/shared/stores/socketStore';
import { resetBackendUrl } from '@/shared/services/backendUrl';
import { storedSession } from '@/features/auth/services/sessionStorage';
import { login } from '@/features/auth/services/signIn';
import { logger } from '@/shared/utils/logger';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Every auth flow goes through the backend: loading the Supabase SDK fails the test.
jest.mock(
	'@supabase/supabase-js',
	() => {
		throw new Error('supabase must not load');
	},
	{ virtual: true }
);

jest.mock('@/features/auth/services/googleSignIn', () => ({ signInWithGoogle: jest.fn() }));
jest.mock('@/features/auth/services/facebookSignIn', () => ({ signInWithFacebook: jest.fn() }));

jest.mock('@/shared/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('socket.io-client', () => ({ io: jest.fn() }));

const socketDisconnect = jest.fn();

function withOpenSocket(): void {
	useSocketStore.setState({
		socket: { disconnect: socketDisconnect } as unknown as Socket,
		isConnected: true,
	});
}

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
	await storedSession.save({
		user,
		accessToken: 'old-access',
		refreshToken: 'old-refresh',
		tokenExpiresAt: useAuthStore.getState().tokenExpiresAt,
	});
}

function calledUrls(): string[] {
	return fetchMock.mock.calls.map(([url]) => url as string);
}

beforeEach(async () => {
	jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	globalThis.fetch = fetchMock as unknown as typeof fetch;
	fetchMock.mockReset();
	await AsyncStorage.clear();
	await resetBackendUrl();
	await signedIn();
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('refreshAccessToken', () => {
	it('ends the session locally when the refresh token is refused (401)', async () => {
		socketDisconnect.mockReset();
		withOpenSocket();
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
		expect(calledUrls()).toHaveLength(1);
		expect(calledUrls()[0]).toMatch(/\/api\/auth\/refresh$/);
		expect(calledUrls().some(url => url.endsWith('/api/auth/logout'))).toBe(false);
		expect(socketDisconnect).toHaveBeenCalledTimes(1);
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
	});
});

describe('logout', () => {
	beforeEach(() => {
		// A valid token: apiRequest would refresh an expiring one first.
		useAuthStore.setState({ tokenExpiresAt: Date.now() + 3_600_000 });
		socketDisconnect.mockReset();
		withOpenSocket();
	});

	async function expectSignedOut(): Promise<void> {
		expect(useAuthStore.getState()).toMatchObject({
			user: null,
			accessToken: null,
			refreshToken: null,
			tokenExpiresAt: null,
			isAuthenticated: false,
			isLoading: false,
		});
		expect(await AsyncStorage.getItem('@zumik/access_token')).toBeNull();
		expect(await AsyncStorage.getItem('@zumik/refresh_token')).toBeNull();
		expect(await AsyncStorage.getItem('@zumik/is_authenticated')).toBeNull();
		expect(socketDisconnect).toHaveBeenCalledTimes(1);
		expect(useSocketStore.getState()).toMatchObject({ socket: null, isConnected: false });
	}

	it('revokes the session on the backend, disconnects the socket and clears the session', async () => {
		fetchMock.mockResolvedValue(jsonResponse(200, { success: true, data: {} }));

		await useAuthStore.getState().logout();

		expect(calledUrls()).toHaveLength(1);
		expect(calledUrls()[0]).toMatch(/\/api\/auth\/logout$/);
		const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect((init.headers as Record<string, string>).Authorization).toBe('Bearer old-access');
		await expectSignedOut();
	});

	it('still ends the session when the backend logout fails', async () => {
		fetchMock.mockRejectedValue(new TypeError('Network request failed'));

		await useAuthStore.getState().logout();

		await expectSignedOut();
	});
});

// Keys as defined in services/sessionStorage.ts.
const KEYS = {
	user: '@zumik/auth_user',
	access: '@zumik/access_token',
	refresh: '@zumik/refresh_token',
	isAuth: '@zumik/is_authenticated',
	expiresAt: '@zumik/token_expires_at',
} as const;

/** The in-memory state of a fresh app start; storage is left untouched. */
function resetMemory(): void {
	useAuthStore.setState({
		user: null,
		accessToken: null,
		refreshToken: null,
		tokenExpiresAt: null,
		isAuthenticated: false,
		isLoading: false,
		isRefreshing: false,
	});
}

async function signedOut(): Promise<void> {
	resetMemory();
	await AsyncStorage.clear();
}

const sessionExpiresAt = Math.floor(Date.now() / 1000) + 3600;

const session = {
	accessToken: 'new-access',
	refreshToken: 'new-refresh',
	expiresIn: 3600,
	expiresAt: sessionExpiresAt,
};

function authResponse(withSession: object | null = session, extra: object = {}): Response {
	return jsonResponse(200, {
		success: true,
		data: { user, ...(withSession ? { session: withSession } : {}), ...extra },
	});
}

function expectAuthenticated(): void {
	expect(useAuthStore.getState()).toMatchObject({
		user,
		accessToken: 'new-access',
		refreshToken: 'new-refresh',
		tokenExpiresAt: sessionExpiresAt * 1000,
		isAuthenticated: true,
		isLoading: false,
	});
}

async function expectPersisted(): Promise<void> {
	expect(JSON.parse((await AsyncStorage.getItem(KEYS.user)) as string)).toEqual(user);
	expect(await AsyncStorage.getItem(KEYS.access)).toBe('new-access');
	expect(await AsyncStorage.getItem(KEYS.refresh)).toBe('new-refresh');
	expect(await AsyncStorage.getItem(KEYS.isAuth)).toBe('true');
	expect(await AsyncStorage.getItem(KEYS.expiresAt)).toBe(String(sessionExpiresAt * 1000));
}

async function expectSignedOutAndNothingStored(): Promise<void> {
	expect(useAuthStore.getState()).toMatchObject({
		user: null,
		accessToken: null,
		refreshToken: null,
		tokenExpiresAt: null,
		isAuthenticated: false,
		isLoading: false,
	});
	expect(await AsyncStorage.multiGet(Object.values(KEYS))).toEqual(
		Object.values(KEYS).map(key => [key, null])
	);
}

describe('refresh during use', () => {
	it('shares one backend refresh between concurrent callers', async () => {
		fetchMock.mockResolvedValue(authResponse());

		const results = await Promise.all([
			useAuthStore.getState().refreshAccessToken(),
			useAuthStore.getState().refreshAccessToken(),
		]);

		expect(results).toEqual([true, true]);
		expect(calledUrls()).toHaveLength(1);
		expect(calledUrls()[0]).toMatch(/\/api\/auth\/refresh$/);
		expectAuthenticated();
		await expectPersisted();
	});

	it('gives every concurrent caller false and clears the session when the refresh is refused', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(401, {
				success: false,
				error: { message: 'Invalid or expired refresh token', code: 'INVALID_REFRESH_TOKEN' },
			})
		);

		const results = await Promise.all([
			useAuthStore.getState().refreshAccessToken(),
			useAuthStore.getState().refreshAccessToken(),
		]);

		expect(results).toEqual([false, false]);
		expect(calledUrls()).toHaveLength(1);
		await expectSignedOutAndNothingStored();
	});
});

describe('legacy SDK session (before #376)', () => {
	const LEGACY_KEY = 'sb-abcdefgh-auth-token';

	it('removes it at startup and keeps the backend session', async () => {
		await AsyncStorage.setItem(LEGACY_KEY, '{"access_token":"a","refresh_token":"r"}');
		await AsyncStorage.setItem('@zumik/theme', 'dark');
		resetMemory();

		await useAuthStore.getState().loadFromStorage();

		expect(await AsyncStorage.getItem(LEGACY_KEY)).toBeNull();
		expect(await AsyncStorage.getItem('@zumik/theme')).toBe('dark');
		expect(useAuthStore.getState()).toMatchObject({
			accessToken: 'old-access',
			isAuthenticated: true,
		});
	});

	it('removes it with the session', async () => {
		await AsyncStorage.setItem(LEGACY_KEY, '{"access_token":"a","refresh_token":"r"}');

		await storedSession.clear();

		expect(await AsyncStorage.getItem(LEGACY_KEY)).toBeNull();
		expect(await AsyncStorage.getItem(KEYS.access)).toBeNull();
	});
});

describe('session persistence', () => {
	beforeEach(signedOut);

	it('restores a stored session after a restart', async () => {
		const expiresAtMs = sessionExpiresAt * 1000;
		await AsyncStorage.multiSet([
			[KEYS.user, JSON.stringify(user)],
			[KEYS.access, 'stored-access'],
			[KEYS.refresh, 'stored-refresh'],
			[KEYS.isAuth, 'true'],
			[KEYS.expiresAt, String(expiresAtMs)],
		]);

		await useAuthStore.getState().loadFromStorage();

		expect(useAuthStore.getState()).toMatchObject({
			user,
			accessToken: 'stored-access',
			refreshToken: 'stored-refresh',
			tokenExpiresAt: expiresAtMs,
			isAuthenticated: true,
		});
		expect(typeof useAuthStore.getState().tokenExpiresAt).toBe('number');
	});

	it('stays signed out when nothing is stored', async () => {
		await useAuthStore.getState().loadFromStorage();

		await expectSignedOutAndNothingStored();
	});

	it('stays signed out when the session flag is missing', async () => {
		await AsyncStorage.multiSet([
			[KEYS.user, JSON.stringify(user)],
			[KEYS.access, 'stored-access'],
			[KEYS.refresh, 'stored-refresh'],
		]);

		await useAuthStore.getState().loadFromStorage();

		expect(useAuthStore.getState()).toMatchObject({
			user: null,
			accessToken: null,
			isAuthenticated: false,
		});
	});

	it('clears the stored session when the stored user is corrupt', async () => {
		await AsyncStorage.multiSet([
			[KEYS.user, '{not json'],
			[KEYS.access, 'stored-access'],
			[KEYS.refresh, 'stored-refresh'],
			[KEYS.isAuth, 'true'],
			[KEYS.expiresAt, String(sessionExpiresAt * 1000)],
		]);

		await useAuthStore.getState().loadFromStorage();

		await expectSignedOutAndNothingStored();
		expect(logger.error).toHaveBeenCalledWith(
			'Failed to load auth state from storage:',
			expect.anything()
		);
	});

	it('restores the same session after login and a restart', async () => {
		fetchMock.mockResolvedValue(authResponse());
		await login({ email: 'a@example.com', password: 'Secret1!' });

		resetMemory();
		await useAuthStore.getState().loadFromStorage();

		expectAuthenticated();
	});
});

describe('setAvatarUrl (#351)', () => {
	const URL = 'https://cdn.example.com/avatars/user-a/new.jpg';

	it('sets the new avatar on the user and persists it', async () => {
		await useAuthStore.getState().setAvatarUrl(URL);

		expect(useAuthStore.getState().user?.avatarUrl).toBe(URL);
		const stored = JSON.parse((await AsyncStorage.getItem('@zumik/auth_user')) ?? '{}');
		expect(stored.avatarUrl).toBe(URL);
	});

	it('clears the avatar after a removal', async () => {
		await useAuthStore.getState().setAvatarUrl(URL);
		await useAuthStore.getState().setAvatarUrl(null);

		expect(useAuthStore.getState().user?.avatarUrl).toBeUndefined();
		expect(useAuthStore.getState().user?.username).toBe('alice');
	});
});
