type GoogleWeb = typeof import('./googleSignIn.web');

interface ButtonConfig {
	size: string;
	width?: number;
	click_listener: () => void;
}

const mockLoadScript = jest.fn();
let mockClientId: string | undefined;

jest.mock('@/features/auth/utils/loadScript', () => ({
	loadScript: (src: string) => mockLoadScript(src),
}));
jest.mock('expo-constants', () => ({
	get expoConfig() {
		return { extra: { EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: mockClientId } };
	},
}));
jest.mock('@react-native-google-signin/google-signin', () => {
	throw new Error('the web variant must not load the native SDK');
});

const initialize = jest.fn();
const renderButton = jest.fn();
const target = { offsetWidth: 520 };

/** The callback Google Identity Services calls with the credential. */
function credentialCallback(): (response: { credential?: string }) => void {
	return initialize.mock.calls[0][0].callback;
}

function buttonConfig(call: number): ButtonConfig {
	return renderButton.mock.calls[call][1];
}

function load(): GoogleWeb {
	let module: GoogleWeb | undefined;
	jest.isolateModules(() => {
		module = jest.requireActual<GoogleWeb>('./googleSignIn.web');
	});
	return module as GoogleWeb;
}

beforeEach(() => {
	mockClientId = 'web-client-id';
	mockLoadScript.mockReset().mockResolvedValue(undefined);
	initialize.mockReset();
	renderButton.mockReset();
	(globalThis as { google?: unknown }).google = { accounts: { id: { initialize, renderButton } } };
});

afterEach(() => {
	delete (globalThis as { google?: unknown }).google;
});

describe('googleSignIn (web)', () => {
	it('loads Google Identity Services once and renders its button', async () => {
		const { renderGoogleButton } = load();

		await renderGoogleButton(target, 'form', jest.fn());
		await renderGoogleButton(target, 'row', jest.fn());

		expect(mockLoadScript).toHaveBeenCalledWith('https://accounts.google.com/gsi/client');
		expect(initialize).toHaveBeenCalledTimes(1);
		expect(initialize).toHaveBeenCalledWith(
			expect.objectContaining({ client_id: 'web-client-id', ux_mode: 'popup' })
		);
		expect(buttonConfig(0)).toMatchObject({ size: 'large', width: 400 });
		expect(buttonConfig(1)).toMatchObject({ size: 'medium' });
		expect(buttonConfig(1).width).toBeUndefined();
	});

	it('hands the credential to the button, then to one sign-in', async () => {
		const { renderGoogleButton, signInWithGoogle } = load();
		const onCredential = jest.fn();
		await renderGoogleButton(target, 'form', onCredential);

		credentialCallback()({ credential: 'google-id-token' });

		expect(onCredential).toHaveBeenCalledTimes(1);
		await expect(signInWithGoogle()).resolves.toBe('google-id-token');
		await expect(signInWithGoogle()).rejects.toThrow('starts from the Google button');
	});

	it('gives the credential to the clicked button, else to the latest one', async () => {
		const { renderGoogleButton } = load();
		const login = jest.fn();
		const register = jest.fn();
		await renderGoogleButton(target, 'form', login);
		const releaseRegister = await renderGoogleButton(target, 'form', register);

		credentialCallback()({ credential: 'first' });
		expect(register).toHaveBeenCalledTimes(1);

		buttonConfig(0).click_listener();
		credentialCallback()({ credential: 'second' });
		expect(login).toHaveBeenCalledTimes(1);

		releaseRegister();
		buttonConfig(0).click_listener();
		credentialCallback()({ credential: 'third' });
		expect(login).toHaveBeenCalledTimes(2);
		expect(register).toHaveBeenCalledTimes(1);
	});

	it('does nothing when the popup closes without a credential', async () => {
		const { renderGoogleButton } = load();
		const onCredential = jest.fn();
		await renderGoogleButton(target, 'form', onCredential);

		credentialCallback()({});

		expect(onCredential).not.toHaveBeenCalled();
	});

	it('rejects when the script does not load', async () => {
		const { renderGoogleButton, signInWithGoogle } = load();
		mockLoadScript.mockRejectedValue(
			new Error('Could not load https://accounts.google.com/gsi/client')
		);

		await expect(renderGoogleButton(target, 'form', jest.fn())).rejects.toThrow('Could not load');
		await expect(signInWithGoogle()).rejects.toThrow('Could not load');
		expect(renderButton).not.toHaveBeenCalled();
	});

	it('rejects when the script loads without the Google API', async () => {
		const { renderGoogleButton } = load();
		delete (globalThis as { google?: unknown }).google;

		await expect(renderGoogleButton(target, 'form', jest.fn())).rejects.toThrow('did not start');
	});

	it('rejects without a client ID, before loading anything', async () => {
		mockClientId = undefined;
		const { renderGoogleButton } = load();

		await expect(renderGoogleButton(target, 'form', jest.fn())).rejects.toThrow('not configured');
		expect(mockLoadScript).not.toHaveBeenCalled();
	});

	it('configures nothing at app start', () => {
		const { configureGoogleSignIn } = load();

		configureGoogleSignIn();

		expect(mockLoadScript).not.toHaveBeenCalled();
	});
});
