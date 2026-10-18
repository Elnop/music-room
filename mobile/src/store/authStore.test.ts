import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '@store/authStore';
import { useSocketStore } from '@store/socketStore';
import { resetBackendUrl } from '@/services/backendUrl';
import { signInWithFacebook, signInWithGoogle } from '@services/oauth';

const mockSupabaseAuth = {
	signInWithPassword: jest.fn(),
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
	jest.mocked(signInWithGoogle).mockReset();
	jest.mocked(signInWithFacebook).mockReset();
	mockSupabaseAuth.signInWithPassword.mockReset().mockResolvedValue({ data: {}, error: null });
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
		expect(mockSupabaseAuth.signOut).toHaveBeenCalledWith({ scope: 'local' });
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
			error: null,
		});
		expect(await AsyncStorage.getItem('@zumik/access_token')).toBeNull();
		expect(await AsyncStorage.getItem('@zumik/refresh_token')).toBeNull();
		expect(await AsyncStorage.getItem('@zumik/is_authenticated')).toBeNull();
		expect(mockSupabaseAuth.signOut).toHaveBeenCalledWith({ scope: 'local' });
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

	it('still ends the session when the Supabase sign-out throws', async () => {
		fetchMock.mockResolvedValue(jsonResponse(200, { success: true, data: {} }));
		mockSupabaseAuth.signOut.mockRejectedValue(new Error('storage unavailable'));

		await useAuthStore.getState().logout();

		await expectSignedOut();
	});
});

// Keys as defined by STORAGE_KEYS in authStore.ts.
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
		error: null,
		linkedProviders: null,
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

function requestAt(index = 0): { url: string; init: RequestInit; body: unknown } {
	const [url, init] = fetchMock.mock.calls[index] as [string, RequestInit];
	return { url, init, body: JSON.parse(init.body as string) };
}

function expectAuthenticated(): void {
	expect(useAuthStore.getState()).toMatchObject({
		user,
		accessToken: 'new-access',
		refreshToken: 'new-refresh',
		tokenExpiresAt: sessionExpiresAt * 1000,
		isAuthenticated: true,
		isLoading: false,
		error: null,
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

describe('login', () => {
	beforeEach(signedOut);

	it('authenticates and persists the session', async () => {
		fetchMock.mockResolvedValue(authResponse());

		await useAuthStore.getState().login('a@example.com', 'Secret1!');

		const { url, init, body } = requestAt();
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(url).toMatch(/\/api\/auth\/login$/);
		expect(init.method).toBe('POST');
		expect(body).toEqual({ email: 'a@example.com', password: 'Secret1!' });
		expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
			email: 'a@example.com',
			password: 'Secret1!',
		});
		expectAuthenticated();
		await expectPersisted();
	});

	it('rejects and stores nothing when the password is wrong', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(401, {
				success: false,
				error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
			})
		);

		// Signed out, the 401 is the backend's answer, not an expired session (#235).
		await expect(useAuthStore.getState().login('a@example.com', 'wrong')).rejects.toThrow(
			'Invalid email or password'
		);

		expect(calledUrls()).toHaveLength(1);
		expect(calledUrls()[0]).toMatch(/\/api\/auth\/login$/);
		expect(useAuthStore.getState().error).toBe('Email ou mot de passe incorrect');
		expect(mockSupabaseAuth.signInWithPassword).not.toHaveBeenCalled();
		await expectSignedOutAndNothingStored();
	});
});

describe('register', () => {
	beforeEach(signedOut);

	const input = {
		email: 'new@example.com',
		password: 'Secret1!',
		username: 'newbie',
		displayName: 'New',
	};

	it('returns the verification step without signing in', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(201, {
				success: true,
				data: { user: { ...user, id: 'user-new' }, requiresVerification: true },
			})
		);

		await expect(useAuthStore.getState().register(input)).resolves.toEqual({
			requiresVerification: true,
			userId: 'user-new',
			email: 'new@example.com',
		});

		const { url, init, body } = requestAt();
		expect(url).toMatch(/\/api\/auth\/register$/);
		expect(init.method).toBe('POST');
		expect(body).toEqual(input);
		await expectSignedOutAndNothingStored();
		expect(useAuthStore.getState().error).toBeNull();
	});

	it('authenticates and persists the session when the backend returns one', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(201, { success: true, data: { user, session, requiresVerification: false } })
		);

		await expect(useAuthStore.getState().register(input)).resolves.toEqual({
			requiresVerification: false,
		});

		expect(requestAt().url).toMatch(/\/api\/auth\/register$/);
		expectAuthenticated();
		await expectPersisted();
	});
});

describe('loginWithGoogle', () => {
	beforeEach(signedOut);

	it('exchanges the Google ID token for a persisted session', async () => {
		jest.mocked(signInWithGoogle).mockResolvedValue('google-id-token');
		fetchMock.mockResolvedValue(authResponse());

		await useAuthStore.getState().loginWithGoogle();

		const { url, init, body } = requestAt();
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(url).toMatch(/\/api\/auth\/google$/);
		expect(init.method).toBe('POST');
		expect(body).toEqual({ idToken: 'google-id-token' });
		expectAuthenticated();
		await expectPersisted();
		expect(mockSupabaseAuth.setSession).toHaveBeenCalledWith({
			access_token: 'new-access',
			refresh_token: 'new-refresh',
		});
	});

	it('stays signed out without error or request when the user cancels', async () => {
		jest.mocked(signInWithGoogle).mockRejectedValue(new Error('SIGN_IN_CANCELLED'));

		await expect(useAuthStore.getState().loginWithGoogle()).resolves.toBeUndefined();

		expect(fetchMock).not.toHaveBeenCalled();
		expect(useAuthStore.getState().error).toBeNull();
		await expectSignedOutAndNothingStored();
	});

	it('shows a French message and stores nothing when the backend refuses the token', async () => {
		jest.mocked(signInWithGoogle).mockResolvedValue('google-id-token');
		fetchMock.mockResolvedValue(
			jsonResponse(400, {
				success: false,
				error: { message: 'Invalid Google token', code: 'INVALID_TOKEN' },
			})
		);

		await expect(useAuthStore.getState().loginWithGoogle()).resolves.toBeUndefined();

		expect(useAuthStore.getState().error).toBe('La connexion avec Google a échoué. Réessayez.');
		expect(mockSupabaseAuth.setSession).not.toHaveBeenCalled();
		await expectSignedOutAndNothingStored();
	});
});

describe('loginWithFacebook', () => {
	beforeEach(signedOut);

	it('exchanges the Facebook access token for a persisted session', async () => {
		jest.mocked(signInWithFacebook).mockResolvedValue('facebook-access-token');
		fetchMock.mockResolvedValue(authResponse());

		await useAuthStore.getState().loginWithFacebook();

		const { url, init, body } = requestAt();
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(url).toMatch(/\/api\/auth\/facebook$/);
		expect(init.method).toBe('POST');
		expect(body).toEqual({ accessToken: 'facebook-access-token' });
		expectAuthenticated();
		await expectPersisted();
		expect(mockSupabaseAuth.setSession).toHaveBeenCalledWith({
			access_token: 'new-access',
			refresh_token: 'new-refresh',
		});
	});

	it('stays signed out without error or request when the user cancels', async () => {
		jest.mocked(signInWithFacebook).mockRejectedValue(new Error('SIGN_IN_CANCELLED'));

		await expect(useAuthStore.getState().loginWithFacebook()).resolves.toBeUndefined();

		expect(fetchMock).not.toHaveBeenCalled();
		expect(useAuthStore.getState().error).toBeNull();
		await expectSignedOutAndNothingStored();
	});

	it('shows a French message and stores nothing when the backend refuses the token', async () => {
		jest.mocked(signInWithFacebook).mockResolvedValue('facebook-access-token');
		fetchMock.mockResolvedValue(
			jsonResponse(400, {
				success: false,
				error: { message: 'Invalid Facebook token', code: 'INVALID_TOKEN' },
			})
		);

		await expect(useAuthStore.getState().loginWithFacebook()).resolves.toBeUndefined();

		expect(useAuthStore.getState().error).toBe('La connexion avec Facebook a échoué. Réessayez.');
		await expectSignedOutAndNothingStored();
		expect(mockSupabaseAuth.setSession).not.toHaveBeenCalled();
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
		expect(console.error).toHaveBeenCalledWith(
			'Failed to load auth state from storage:',
			expect.anything()
		);
	});

	it('restores the same session after login and a restart', async () => {
		fetchMock.mockResolvedValue(authResponse());
		await useAuthStore.getState().login('a@example.com', 'Secret1!');

		resetMemory();
		await useAuthStore.getState().loadFromStorage();

		expectAuthenticated();
	});
});

describe('setAvatarUrl (#351)', () => {
	const URL = 'https://x.supabase.co/storage/v1/object/public/avatars/user-a/new.jpg';

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
