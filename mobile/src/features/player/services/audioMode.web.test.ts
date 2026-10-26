import { configureAudioMode } from './audioMode.web';

jest.mock('expo-audio', () => {
	throw new Error('the web variant must not load expo-audio');
});

describe('configureAudioMode (web)', () => {
	it('configures nothing in a tab', () => {
		expect(() => configureAudioMode()).not.toThrow();
	});
});
