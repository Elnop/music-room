import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { signInWithGoogle } from '@services/oauth';

jest.mock('expo-constants', () => ({
	expoConfig: {
		extra: {
			EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'web-client-id',
			EXPO_PUBLIC_FACEBOOK_APP_ID: 'fb-app-id',
		},
	},
}));

jest.mock('@react-native-google-signin/google-signin', () => {
	// The package's exports map hides its helpers; this mirrors the library's documented check.
	const isCancelledResponse = (response: { type: string }) => response.type === 'cancelled';
	return {
		GoogleSignin: {
			configure: jest.fn(),
			hasPlayServices: jest.fn(),
			signIn: jest.fn(),
		},
		isCancelledResponse,
		statusCodes: {
			SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
			IN_PROGRESS: 'IN_PROGRESS',
			PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
		},
	};
});

jest.mock('react-native-fbsdk-next', () => ({
	LoginManager: { logInWithPermissions: jest.fn() },
	AccessToken: { getCurrentAccessToken: jest.fn() },
	Settings: { setAppID: jest.fn(), initializeSDK: jest.fn() },
}));

const signIn = GoogleSignin.signIn as jest.Mock;

beforeEach(() => {
	jest.spyOn(console, 'error').mockImplementation(() => undefined);
	(GoogleSignin.hasPlayServices as jest.Mock).mockResolvedValue(true);
	signIn.mockReset();
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('signInWithGoogle', () => {
	it('rejects with SIGN_IN_CANCELLED when the user cancels', async () => {
		signIn.mockResolvedValue({ type: 'cancelled', data: null });

		await expect(signInWithGoogle()).rejects.toThrow(new Error('SIGN_IN_CANCELLED'));
	});

	it('returns the ID token on success', async () => {
		signIn.mockResolvedValue({ type: 'success', data: { idToken: 'google-id-token' } });

		await expect(signInWithGoogle()).resolves.toBe('google-id-token');
	});
});
