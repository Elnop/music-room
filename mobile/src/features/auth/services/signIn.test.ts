import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { getBackendUrl, resetBackendUrl } from '@/shared/services/backendUrl';
import { logger } from '@/shared/utils/logger';
import { login, register, signInWithProvider, verifyEmail } from './signIn';
import { forgotPassword, resetPassword } from './passwordApi';
import { oauthErrorMessage } from './oauthErrors';
import { signInWithGoogle } from './googleSignIn';
import { signInWithFacebook } from './facebookSignIn';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('./googleSignIn', () => ({ signInWithGoogle: jest.fn() }));
jest.mock('./facebookSignIn', () => ({ signInWithFacebook: jest.fn() }));

jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('socket.io-client', () => ({ io: jest.fn() }));

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
	await AsyncStorage.clear();
	await resetBackendUrl();
});

afterEach(() => {
	jest.restoreAllMocks();
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

		await login({ email: 'a@example.com', password: 'Secret1!' });

		const { url, init, body } = requestAt();
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(url).toMatch(/\/api\/auth\/login$/);
		expect(init.method).toBe('POST');
		expect(body).toEqual({ email: 'a@example.com', password: 'Secret1!' });
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
		await expect(login({ email: 'a@example.com', password: 'wrong' })).rejects.toThrow(
			'Invalid email or password'
		);

		expect(calledUrls()).toHaveLength(1);
		expect(calledUrls()[0]).toMatch(/\/api\/auth\/login$/);
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

		await expect(register(input)).resolves.toEqual({
			requiresVerification: true,
			userId: 'user-new',
			email: 'new@example.com',
		});

		const { url, init, body } = requestAt();
		expect(url).toMatch(/\/api\/auth\/register$/);
		expect(init.method).toBe('POST');
		expect(body).toEqual(input);
		await expectSignedOutAndNothingStored();
	});

	it('authenticates and persists the session when the backend returns one', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(201, { success: true, data: { user, session, requiresVerification: false } })
		);

		await expect(register(input)).resolves.toEqual({
			requiresVerification: false,
		});

		expect(requestAt().url).toMatch(/\/api\/auth\/register$/);
		expectAuthenticated();
		await expectPersisted();
	});

	it('calls only the backend register endpoint', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(201, { success: true, data: { user, session, requiresVerification: false } })
		);

		await register(input);

		expect(calledUrls()).toHaveLength(1);
		expect(calledUrls()[0]).toBe(`${getBackendUrl()}/api/auth/register`);
	});
});

describe('loginWithGoogle', () => {
	beforeEach(signedOut);

	it('exchanges the Google ID token for a persisted session', async () => {
		jest.mocked(signInWithGoogle).mockResolvedValue('google-id-token');
		fetchMock.mockResolvedValue(authResponse());

		await signInWithProvider('google');

		const { url, init, body } = requestAt();
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(url).toMatch(/\/api\/auth\/google$/);
		expect(init.method).toBe('POST');
		expect(body).toEqual({ idToken: 'google-id-token' });
		expectAuthenticated();
		await expectPersisted();
	});

	it('stays signed out without error or request when the user cancels', async () => {
		jest.mocked(signInWithGoogle).mockRejectedValue(new Error('SIGN_IN_CANCELLED'));

		await expect(signInWithProvider('google')).rejects.toThrow('SIGN_IN_CANCELLED');

		expect(fetchMock).not.toHaveBeenCalled();
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

		const failure = await signInWithProvider('google').catch((error: unknown) => error);

		expect(oauthErrorMessage('google', failure)).toBe(
			'La connexion avec Google a échoué. Réessayez.'
		);
		await expectSignedOutAndNothingStored();
	});
});

describe('loginWithFacebook', () => {
	beforeEach(signedOut);

	it('exchanges the Facebook access token for a persisted session', async () => {
		jest.mocked(signInWithFacebook).mockResolvedValue('facebook-access-token');
		fetchMock.mockResolvedValue(authResponse());

		await signInWithProvider('facebook');

		const { url, init, body } = requestAt();
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(url).toMatch(/\/api\/auth\/facebook$/);
		expect(init.method).toBe('POST');
		expect(body).toEqual({ accessToken: 'facebook-access-token' });
		expectAuthenticated();
		await expectPersisted();
	});

	it('stays signed out without error or request when the user cancels', async () => {
		jest.mocked(signInWithFacebook).mockRejectedValue(new Error('SIGN_IN_CANCELLED'));

		await expect(signInWithProvider('facebook')).rejects.toThrow('SIGN_IN_CANCELLED');

		expect(fetchMock).not.toHaveBeenCalled();
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

		const failure = await signInWithProvider('facebook').catch((error: unknown) => error);

		expect(oauthErrorMessage('facebook', failure)).toBe(
			'La connexion avec Facebook a échoué. Réessayez.'
		);
		await expectSignedOutAndNothingStored();
	});
});

describe('verifyEmail', () => {
	beforeEach(signedOut);

	it('exchanges the code for a persisted session through the backend', async () => {
		fetchMock.mockResolvedValue(authResponse());

		await verifyEmail('user-a', '123456');

		const { url, init, body } = requestAt();
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(url).toMatch(/\/api\/auth\/verify-email$/);
		expect(init.method).toBe('POST');
		expect(body).toEqual({ userId: 'user-a', code: '123456' });
		expectAuthenticated();
		await expectPersisted();
	});
});

describe('password reset', () => {
	beforeEach(signedOut);

	it('requests the code, then resets the password, through the backend only', async () => {
		fetchMock.mockResolvedValue(jsonResponse(200, { success: true, data: { message: 'ok' } }));

		await forgotPassword('a@example.com');
		await resetPassword('a@example.com', '123456', 'NewSecret1!');

		expect(calledUrls()).toHaveLength(2);
		expect(requestAt(0).url).toMatch(/\/api\/auth\/forgot-password$/);
		expect(requestAt(0).body).toEqual({ email: 'a@example.com' });
		expect(requestAt(1).url).toMatch(/\/api\/auth\/reset-password$/);
		expect(requestAt(1).body).toEqual({
			email: 'a@example.com',
			code: '123456',
			newPassword: 'NewSecret1!',
		});
		// A reset does not sign in: the user logs in with the new password.
		await expectSignedOutAndNothingStored();
	});
});
