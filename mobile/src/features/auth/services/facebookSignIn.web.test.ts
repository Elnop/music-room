import { initializeFacebookSDK, signInWithFacebook } from './facebookSignIn.web';

jest.mock('react-native-fbsdk-next', () => {
	throw new Error('the web variant must not load the native SDK');
});

describe('facebookSignIn (web)', () => {
	it('initializes nothing and rejects a login', async () => {
		expect(() => initializeFacebookSDK()).not.toThrow();
		await expect(signInWithFacebook()).rejects.toThrow('not available in the browser');
	});
});
