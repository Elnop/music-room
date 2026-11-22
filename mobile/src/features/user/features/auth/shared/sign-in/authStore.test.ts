import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Socket } from 'socket.io-client';
import { authStore } from '@/features/user/features/auth/shared/sign-in/authStore';
import { socketStore } from '@/shared/backend/socketStore';
import { resetBackendUrl } from '@/shared/backend/lib/backendUrl';
import * as storedSession from '@/features/user/features/auth/shared/sign-in/lib/sessionStorage';
import { SIGNED_OUT } from '@/features/user/features/auth/shared/sign-in/configs/sessionConfig';
import { fail, ok } from '@test-utils/fetchResponses';
import { login } from '@/features/user/features/auth/shared/sign-in/lib/signIn';
import { logger } from '@/shared/logging/logger';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock(
	'@supabase/supabase-js',
	() => {
		throw new Error('supabase must not load');
	},
	{ virtual: true },
);

jest.mock('@/features/user/features/auth/shared/sign-in/lib/googleSignIn', () => ({
	signInWithGoogle: jest.fn(),
}));
jest.mock('@/features/user/features/auth/shared/sign-in/lib/facebookSignIn', () => ({
	signInWithFacebook: jest.fn(),
}));

jest.mock('@/shared/backend/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('socket.io-client', () => ({ io: jest.fn() }));

const socketDisconnect = jest.fn();

function withOpenSocket(): void {
	socketStore.setState({
		socket: { disconnect: socketDisconnect } as unknown as Socket,
		isConnected: true,
	});
}

const fetchMock = jest.fn();

const user = {
	id: 'user-a',
	email: 'a@example.com',
	username: 'alice',
	createdAt: '2025-01-01T00:00:00Z',
	updatedAt: '2025-01-01T00:00:00Z',
};

async function signedIn(): Promise<void> {
	authStore.setState({
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
		tokenExpiresAt: authStore.getState().tokenExpiresAt,
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
			fail(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token'),
		);

		await expect(authStore.getState().refreshAccessToken()).resolves.toBe(false);

		expect(authStore.getState()).toMatchObject({
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
		expect(calledUrls()[0]).toMatch(/\/api\/auth\/refresh$/u);
		expect(calledUrls().some((url) => url.endsWith('/api/auth/logout'))).toBe(false);
		expect(socketDisconnect).toHaveBeenCalledTimes(1);
	});

	it('keeps the session when the auth service is unavailable (503)', async () => {
		fetchMock.mockResolvedValue(
			fail(503, 'AUTH_UNAVAILABLE', 'Authentication service is unavailable'),
		);

		await expect(authStore.getState().refreshAccessToken()).resolves.toBe(false);

		expect(authStore.getState()).toMatchObject({
			accessToken: 'old-access',
			refreshToken: 'old-refresh',
			isAuthenticated: true,
			isRefreshing: false,
		});
		expect(await AsyncStorage.getItem('@zumik/refresh_token')).toBe('old-refresh');
	});

	it('ends the session locally without any request when there is no refresh token', async () => {
		authStore.setState({ refreshToken: null });

		await expect(authStore.getState().refreshAccessToken()).resolves.toBe(false);

		expect(authStore.getState()).toMatchObject({
			user: null,
			accessToken: null,
			isAuthenticated: false,
		});
		expect(await AsyncStorage.getItem('@zumik/access_token')).toBeNull();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('keeps the session when the backend is unreachable', async () => {
		fetchMock.mockRejectedValue(new TypeError('Network request failed'));

		await expect(authStore.getState().refreshAccessToken()).resolves.toBe(false);

		expect(authStore.getState()).toMatchObject({
			accessToken: 'old-access',
			refreshToken: 'old-refresh',
			isAuthenticated: true,
		});
		expect(await AsyncStorage.getItem('@zumik/access_token')).toBe('old-access');
	});

	it('stores the new tokens on success', async () => {
		const expiresAt = Math.floor(Date.now() / 1000) + 3600;
		fetchMock.mockResolvedValue(
			ok({
				user,
				session: {
					accessToken: 'new-access',
					refreshToken: 'new-refresh',
					expiresIn: 3600,
					expiresAt,
				},
			}),
		);

		await expect(authStore.getState().refreshAccessToken()).resolves.toBe(true);

		expect(authStore.getState()).toMatchObject({
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
		authStore.setState({ tokenExpiresAt: Date.now() + 3_600_000 });
		socketDisconnect.mockReset();
		withOpenSocket();
	});

	async function expectSignedOut(): Promise<void> {
		expect(authStore.getState()).toMatchObject({
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
		expect(socketStore.getState()).toMatchObject({ socket: null, isConnected: false });
	}

	it('revokes the session on the backend, disconnects the socket and clears the session', async () => {
		fetchMock.mockResolvedValue(ok({}));

		await authStore.getState().logout();

		expect(calledUrls()).toHaveLength(1);
		expect(calledUrls()[0]).toMatch(/\/api\/auth\/logout$/u);
		const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect((init.headers as Record<string, string>).Authorization).toBe('Bearer old-access');
		await expectSignedOut();
	});

	it('still ends the session when the backend logout fails', async () => {
		fetchMock.mockRejectedValue(new TypeError('Network request failed'));

		await expect(authStore.getState().logout()).resolves.toBeUndefined();

		await expectSignedOut();
	});
});

const KEYS = {
	user: '@zumik/auth_user',
	access: '@zumik/access_token',
	refresh: '@zumik/refresh_token',
	isAuth: '@zumik/is_authenticated',
	expiresAt: '@zumik/token_expires_at',
} as const;

const sessionExpiresAt = Math.floor(Date.now() / 1000) + 3600;

const session = {
	accessToken: 'new-access',
	refreshToken: 'new-refresh',
	expiresIn: 3600,
	expiresAt: sessionExpiresAt,
};

const AUTHENTICATED = {
	user,
	accessToken: 'new-access',
	refreshToken: 'new-refresh',
	tokenExpiresAt: sessionExpiresAt * 1000,
	isAuthenticated: true,
	isLoading: false,
};

const SIGNED_OUT_STATE = {
	user: null,
	accessToken: null,
	refreshToken: null,
	tokenExpiresAt: null,
	isAuthenticated: false,
	isLoading: false,
};

async function expectPersisted(): Promise<void> {
	expect(JSON.parse((await AsyncStorage.getItem(KEYS.user)) as string)).toStrictEqual(user);
	expect(await AsyncStorage.getItem(KEYS.access)).toBe('new-access');
	expect(await AsyncStorage.getItem(KEYS.refresh)).toBe('new-refresh');
	expect(await AsyncStorage.getItem(KEYS.isAuth)).toBe('true');
	expect(await AsyncStorage.getItem(KEYS.expiresAt)).toBe(String(sessionExpiresAt * 1000));
}

function storedSessionValues(): Promise<readonly (readonly [string, string | null])[]> {
	return AsyncStorage.multiGet(Object.values(KEYS));
}

const NOTHING_STORED = Object.values(KEYS).map((key) => [key, null]);

describe('refresh during use', () => {
	it('shares one backend refresh between concurrent callers', async () => {
		fetchMock.mockResolvedValue(ok({ user, session }));

		const results = await Promise.all([
			authStore.getState().refreshAccessToken(),
			authStore.getState().refreshAccessToken(),
		]);

		expect(results).toStrictEqual([true, true]);
		expect(calledUrls()).toHaveLength(1);
		expect(calledUrls()[0]).toMatch(/\/api\/auth\/refresh$/u);
		expect(authStore.getState()).toMatchObject(AUTHENTICATED);
		await expectPersisted();
	});

	it('gives every concurrent caller false and clears the session when the refresh is refused', async () => {
		fetchMock.mockResolvedValue(
			fail(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token'),
		);

		const results = await Promise.all([
			authStore.getState().refreshAccessToken(),
			authStore.getState().refreshAccessToken(),
		]);

		expect(results).toStrictEqual([false, false]);
		expect(calledUrls()).toHaveLength(1);
		expect(authStore.getState()).toMatchObject(SIGNED_OUT_STATE);
		expect(await storedSessionValues()).toStrictEqual(NOTHING_STORED);
	});
});

describe('legacy SDK session (before #376)', () => {
	const LEGACY_KEY = 'sb-abcdefgh-auth-token';

	it('removes it at startup and keeps the backend session', async () => {
		await AsyncStorage.setItem(LEGACY_KEY, '{"access_token":"a","refresh_token":"r"}');
		await AsyncStorage.setItem('@zumik/theme', 'dark');
		authStore.setState(SIGNED_OUT);

		await authStore.getState().loadFromStorage();

		expect(await AsyncStorage.getItem(LEGACY_KEY)).toBeNull();
		expect(await AsyncStorage.getItem('@zumik/theme')).toBe('dark');
		expect(authStore.getState()).toMatchObject({
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
	beforeEach(async () => {
		authStore.setState(SIGNED_OUT);
		await AsyncStorage.clear();
	});

	it('restores a stored session after a restart', async () => {
		const expiresAtMs = sessionExpiresAt * 1000;
		await AsyncStorage.multiSet([
			[KEYS.user, JSON.stringify(user)],
			[KEYS.access, 'stored-access'],
			[KEYS.refresh, 'stored-refresh'],
			[KEYS.isAuth, 'true'],
			[KEYS.expiresAt, String(expiresAtMs)],
		]);

		await authStore.getState().loadFromStorage();

		expect(authStore.getState()).toMatchObject({
			user,
			accessToken: 'stored-access',
			refreshToken: 'stored-refresh',
			tokenExpiresAt: expiresAtMs,
			isAuthenticated: true,
		});
		expect(typeof authStore.getState().tokenExpiresAt).toBe('number');
	});

	it('stays signed out when nothing is stored', async () => {
		await authStore.getState().loadFromStorage();

		expect(authStore.getState()).toMatchObject(SIGNED_OUT_STATE);
		expect(await storedSessionValues()).toStrictEqual(NOTHING_STORED);
	});

	it('stays signed out when the session flag is missing', async () => {
		await AsyncStorage.multiSet([
			[KEYS.user, JSON.stringify(user)],
			[KEYS.access, 'stored-access'],
			[KEYS.refresh, 'stored-refresh'],
		]);

		await authStore.getState().loadFromStorage();

		expect(authStore.getState()).toMatchObject({
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

		await authStore.getState().loadFromStorage();

		expect(authStore.getState()).toMatchObject(SIGNED_OUT_STATE);
		expect(await storedSessionValues()).toStrictEqual(NOTHING_STORED);
		expect(logger.error).toHaveBeenCalledWith(
			'Failed to load auth state from storage:',
			expect.anything(),
		);
	});

	it('restores the same session after login and a restart', async () => {
		fetchMock.mockResolvedValue(ok({ user, session }));
		await login({ email: 'a@example.com', password: 'Secret1!' });

		authStore.setState(SIGNED_OUT);
		await authStore.getState().loadFromStorage();

		expect(authStore.getState()).toMatchObject(AUTHENTICATED);
	});
});

describe('setAvatarUrl (#351)', () => {
	const URL = 'https://cdn.example.com/avatars/user-a/new.jpg';

	it('sets the new avatar on the user and persists it', async () => {
		await authStore.getState().setAvatarUrl(URL);

		expect(authStore.getState().user?.avatarUrl).toBe(URL);
		const stored = JSON.parse((await AsyncStorage.getItem('@zumik/auth_user')) ?? '{}');
		expect(stored.avatarUrl).toBe(URL);
	});

	it('clears the avatar after a removal', async () => {
		await authStore.getState().setAvatarUrl(URL);
		await authStore.getState().setAvatarUrl(null);

		expect(authStore.getState().user?.avatarUrl).toBeUndefined();
		expect(authStore.getState().user?.username).toBe('alice');
	});
});
