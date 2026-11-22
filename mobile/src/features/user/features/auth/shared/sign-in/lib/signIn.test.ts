import AsyncStorage from '@react-native-async-storage/async-storage';
import { authStore } from '@/features/user/features/auth/shared/sign-in/authStore';
import { getBackendUrl, resetBackendUrl } from '@/shared/backend/lib/backendUrl';
import { logger } from '@/shared/logging/logger';
import {
	login,
	register,
	signInWithProvider,
	verifyEmail,
} from '@/features/user/features/auth/shared/sign-in/lib/signIn';
import { oauthErrorMessage } from '@/features/user/features/auth/shared/sign-in/lib/oauthErrorMessage';
import { signInWithGoogle } from '@/features/user/features/auth/shared/sign-in/lib/googleSignIn';
import { signInWithFacebook } from '@/features/user/features/auth/shared/sign-in/lib/facebookSignIn';
import { SIGNED_OUT } from '@/features/user/features/auth/shared/sign-in/configs/sessionConfig';
import { fail, ok } from '@test-utils/fetchResponses';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
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

const fetchMock = jest.fn();

const user = {
	id: 'user-a',
	email: 'a@example.com',
	username: 'alice',
	createdAt: '2025-01-01T00:00:00Z',
	updatedAt: '2025-01-01T00:00:00Z',
};

function calledUrls(): string[] {
	return fetchMock.mock.calls.map(([url]) => url as string);
}

beforeEach(async () => {
	jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	globalThis.fetch = fetchMock as unknown as typeof fetch;
	fetchMock.mockReset();
	jest.mocked(signInWithGoogle).mockReset();
	jest.mocked(signInWithFacebook).mockReset();
	authStore.setState(SIGNED_OUT);
	await AsyncStorage.clear();
	await resetBackendUrl();
});

afterEach(() => {
	jest.restoreAllMocks();
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

function requestAt(index = 0): { url: string; init: RequestInit; body: unknown } {
	const [url, init] = fetchMock.mock.calls[index] as [string, RequestInit];
	return { url, init, body: JSON.parse(init.body as string) };
}

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

const NOTHING_STORED = Object.values(KEYS).map((key) => [key, null]);

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

describe('login', () => {
	it('authenticates and persists the session', async () => {
		fetchMock.mockResolvedValue(ok({ user, session }));

		await login({ email: 'a@example.com', password: 'Secret1!' });

		const { url, init, body } = requestAt();
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(url).toMatch(/\/api\/auth\/login$/u);
		expect(init.method).toBe('POST');
		expect(body).toStrictEqual({ email: 'a@example.com', password: 'Secret1!' });
		expect(authStore.getState()).toMatchObject(AUTHENTICATED);
		await expectPersisted();
	});

	it('rejects and stores nothing when the password is wrong', async () => {
		fetchMock.mockResolvedValue(fail(401, 'INVALID_CREDENTIALS', 'Invalid email or password'));

		await expect(login({ email: 'a@example.com', password: 'wrong' })).rejects.toThrow(
			'Invalid email or password',
		);

		expect(calledUrls()).toHaveLength(1);
		expect(calledUrls()[0]).toMatch(/\/api\/auth\/login$/u);
		expect(authStore.getState()).toMatchObject(SIGNED_OUT_STATE);
		expect(await storedSessionValues()).toStrictEqual(NOTHING_STORED);
	});
});

describe('register', () => {
	const input = {
		email: 'new@example.com',
		password: 'Secret1!',
		username: 'newbie',
		displayName: 'New',
	};

	it('returns the verification step without signing in', async () => {
		fetchMock.mockResolvedValue(
			ok({ user: { ...user, id: 'user-new' }, requiresVerification: true }),
		);

		await expect(register(input)).resolves.toStrictEqual({
			requiresVerification: true,
			userId: 'user-new',
			email: 'new@example.com',
		});

		const { url, init, body } = requestAt();
		expect(url).toMatch(/\/api\/auth\/register$/u);
		expect(init.method).toBe('POST');
		expect(body).toStrictEqual(input);
		expect(authStore.getState()).toMatchObject(SIGNED_OUT_STATE);
		expect(await storedSessionValues()).toStrictEqual(NOTHING_STORED);
	});

	it('authenticates and persists the session when the backend returns one', async () => {
		fetchMock.mockResolvedValue(ok({ user, session, requiresVerification: false }));

		await expect(register(input)).resolves.toStrictEqual({
			requiresVerification: false,
		});

		expect(requestAt().url).toMatch(/\/api\/auth\/register$/u);
		expect(authStore.getState()).toMatchObject(AUTHENTICATED);
		await expectPersisted();
	});

	it('calls only the backend register endpoint', async () => {
		fetchMock.mockResolvedValue(ok({ user, session, requiresVerification: false }));

		await register(input);

		expect(calledUrls()).toHaveLength(1);
		expect(calledUrls()[0]).toBe(`${getBackendUrl()}/api/auth/register`);
	});
});

describe('loginWithGoogle', () => {
	it('exchanges the Google ID token for a persisted session', async () => {
		jest.mocked(signInWithGoogle).mockResolvedValue('google-id-token');
		fetchMock.mockResolvedValue(ok({ user, session }));

		await signInWithProvider('google');

		const { url, init, body } = requestAt();
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(url).toMatch(/\/api\/auth\/google$/u);
		expect(init.method).toBe('POST');
		expect(body).toStrictEqual({ idToken: 'google-id-token' });
		expect(authStore.getState()).toMatchObject(AUTHENTICATED);
		await expectPersisted();
	});

	it('stays signed out without error or request when the user cancels', async () => {
		jest.mocked(signInWithGoogle).mockRejectedValue(new Error('SIGN_IN_CANCELLED'));

		await expect(signInWithProvider('google')).rejects.toThrow('SIGN_IN_CANCELLED');

		expect(fetchMock).not.toHaveBeenCalled();
		expect(authStore.getState()).toMatchObject(SIGNED_OUT_STATE);
		expect(await storedSessionValues()).toStrictEqual(NOTHING_STORED);
	});

	it('shows a French message and stores nothing when the backend refuses the token', async () => {
		jest.mocked(signInWithGoogle).mockResolvedValue('google-id-token');
		fetchMock.mockResolvedValue(fail(400, 'INVALID_TOKEN', 'Invalid Google token'));

		const failure = await signInWithProvider('google').catch((error: unknown) => error);

		expect(oauthErrorMessage('google', failure)).toBe(
			'La connexion avec Google a échoué. Réessayez.',
		);
		expect(authStore.getState()).toMatchObject(SIGNED_OUT_STATE);
		expect(await storedSessionValues()).toStrictEqual(NOTHING_STORED);
	});
});

describe('loginWithFacebook', () => {
	it('exchanges the Facebook access token for a persisted session', async () => {
		jest.mocked(signInWithFacebook).mockResolvedValue('facebook-access-token');
		fetchMock.mockResolvedValue(ok({ user, session }));

		await signInWithProvider('facebook');

		const { url, init, body } = requestAt();
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(url).toMatch(/\/api\/auth\/facebook$/u);
		expect(init.method).toBe('POST');
		expect(body).toStrictEqual({ accessToken: 'facebook-access-token' });
		expect(authStore.getState()).toMatchObject(AUTHENTICATED);
		await expectPersisted();
	});

	it('stays signed out without error or request when the user cancels', async () => {
		jest.mocked(signInWithFacebook).mockRejectedValue(new Error('SIGN_IN_CANCELLED'));

		await expect(signInWithProvider('facebook')).rejects.toThrow('SIGN_IN_CANCELLED');

		expect(fetchMock).not.toHaveBeenCalled();
		expect(authStore.getState()).toMatchObject(SIGNED_OUT_STATE);
		expect(await storedSessionValues()).toStrictEqual(NOTHING_STORED);
	});

	it('shows a French message and stores nothing when the backend refuses the token', async () => {
		jest.mocked(signInWithFacebook).mockResolvedValue('facebook-access-token');
		fetchMock.mockResolvedValue(fail(400, 'INVALID_TOKEN', 'Invalid Facebook token'));

		const failure = await signInWithProvider('facebook').catch((error: unknown) => error);

		expect(oauthErrorMessage('facebook', failure)).toBe(
			'La connexion avec Facebook a échoué. Réessayez.',
		);
		expect(authStore.getState()).toMatchObject(SIGNED_OUT_STATE);
		expect(await storedSessionValues()).toStrictEqual(NOTHING_STORED);
	});
});

describe('verifyEmail', () => {
	it('exchanges the code for a persisted session through the backend', async () => {
		fetchMock.mockResolvedValue(ok({ user, session }));

		await verifyEmail('user-a', '123456');

		const { url, init, body } = requestAt();
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(url).toMatch(/\/api\/auth\/verify-email$/u);
		expect(init.method).toBe('POST');
		expect(body).toStrictEqual({ userId: 'user-a', code: '123456' });
		expect(authStore.getState()).toMatchObject(AUTHENTICATED);
		await expectPersisted();
	});
});
