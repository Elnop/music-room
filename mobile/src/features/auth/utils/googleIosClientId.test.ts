import { googleIosClientId } from './googleIosClientId';

describe('googleIosClientId', () => {
	it('turns the reversed URL scheme back into the client ID', () => {
		expect(googleIosClientId('com.googleusercontent.apps.123-abc')).toBe(
			'123-abc.apps.googleusercontent.com'
		);
	});

	it('gives nothing for a missing or foreign scheme', () => {
		expect(googleIosClientId(undefined)).toBeUndefined();
		expect(googleIosClientId('zumik')).toBeUndefined();
	});
});
