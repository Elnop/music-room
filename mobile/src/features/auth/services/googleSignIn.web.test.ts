import { configureGoogleSignIn, signInWithGoogle } from './googleSignIn.web';

jest.mock('@react-native-google-signin/google-signin', () => {
	throw new Error('the web variant must not load the native SDK');
});

describe('googleSignIn (web)', () => {
	it('configures nothing and rejects a sign-in', async () => {
		expect(() => configureGoogleSignIn()).not.toThrow();
		await expect(signInWithGoogle()).rejects.toThrow('not available in the browser');
	});
});
