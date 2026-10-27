type FacebookWeb = typeof import('./facebookSignIn.web');
type LoginResponse = { status?: string; authResponse?: { accessToken?: string } | null };

const mockLoadScript = jest.fn();
let mockAppId: string | undefined;

jest.mock('@/features/auth/utils/loadScript', () => ({
	loadScript: (src: string) => mockLoadScript(src),
}));
jest.mock('expo-constants', () => ({
	get expoConfig() {
		return { extra: { EXPO_PUBLIC_FACEBOOK_APP_ID: mockAppId } };
	},
}));
jest.mock('react-native-fbsdk-next', () => {
	throw new Error('the web variant must not load the native SDK');
});

const init = jest.fn();
const login = jest.fn();

function answerLogin(response: LoginResponse): void {
	login.mockImplementation((callback: (response: LoginResponse) => void) => callback(response));
}

type Logger = typeof import('@/shared/utils/logger');

/** A fresh module, with the logger instance it writes to. */
function load(): FacebookWeb & Logger {
	let module: (FacebookWeb & Logger) | undefined;
	jest.isolateModules(() => {
		module = {
			...jest.requireActual<FacebookWeb>('./facebookSignIn.web'),
			...jest.requireActual<Logger>('@/shared/utils/logger'),
		};
	});
	return module as FacebookWeb & Logger;
}

beforeEach(() => {
	mockAppId = 'fb-app-id';
	mockLoadScript.mockReset().mockResolvedValue(undefined);
	init.mockReset();
	login.mockReset();
	(globalThis as { FB?: unknown }).FB = { init, login };
});

afterEach(() => {
	delete (globalThis as { FB?: unknown }).FB;
	jest.restoreAllMocks();
});

describe('facebookSignIn (web)', () => {
	it('returns the access token of a connected login', async () => {
		const { signInWithFacebook } = load();
		answerLogin({ status: 'connected', authResponse: { accessToken: 'fb-access-token' } });

		await expect(signInWithFacebook()).resolves.toBe('fb-access-token');
		expect(mockLoadScript).toHaveBeenCalledWith('https://connect.facebook.net/en_US/sdk.js');
		expect(init).toHaveBeenCalledWith(
			expect.objectContaining({ appId: 'fb-app-id', version: 'v21.0' })
		);
		expect(login).toHaveBeenCalledWith(expect.any(Function), { scope: 'public_profile,email' });
	});

	it('initializes the SDK once', async () => {
		const { preloadFacebookSdk, signInWithFacebook } = load();
		answerLogin({ status: 'connected', authResponse: { accessToken: 'token' } });

		preloadFacebookSdk();
		await signInWithFacebook();
		await signInWithFacebook();

		expect(init).toHaveBeenCalledTimes(1);
	});

	it.each([
		['the popup is closed', { status: 'unknown', authResponse: null }],
		['the permissions are declined', { status: 'not_authorized', authResponse: null }],
	])('rejects with SIGN_IN_CANCELLED when %s', async (_case, response) => {
		const { signInWithFacebook } = load();
		answerLogin(response);

		await expect(signInWithFacebook()).rejects.toThrow(new Error('SIGN_IN_CANCELLED'));
	});

	it('rejects when the script does not load', async () => {
		const { signInWithFacebook } = load();
		mockLoadScript.mockRejectedValue(
			new Error('Could not load https://connect.facebook.net/en_US/sdk.js')
		);

		await expect(signInWithFacebook()).rejects.toThrow('Could not load');
		expect(login).not.toHaveBeenCalled();
	});

	it('rejects when the script loads without the SDK', async () => {
		const { signInWithFacebook } = load();
		delete (globalThis as { FB?: unknown }).FB;

		await expect(signInWithFacebook()).rejects.toThrow('did not start');
	});

	it('rejects without an app ID, before loading anything', async () => {
		mockAppId = undefined;
		const { signInWithFacebook } = load();

		await expect(signInWithFacebook()).rejects.toThrow('not configured');
		expect(mockLoadScript).not.toHaveBeenCalled();
	});

	it('logs a failed preload without throwing', async () => {
		const { preloadFacebookSdk, logger } = load();
		const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
		mockLoadScript.mockRejectedValue(new Error('Could not load sdk.js'));

		preloadFacebookSdk();

		await new Promise<void>(resolve => setImmediate(resolve));
		expect(warn).toHaveBeenCalledWith('[OAuth] Facebook SDK not loaded:', {
			errorMessage: 'Could not load sdk.js',
		});
	});

	it('loads nothing at app start', () => {
		const { initializeFacebookSDK } = load();

		initializeFacebookSDK();

		expect(mockLoadScript).not.toHaveBeenCalled();
	});
});
