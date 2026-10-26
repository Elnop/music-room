import { renderHook } from '@testing-library/react-native';
import { useMediaSession } from './useMediaSession.web';

jest.mock('expo-media-control', () => {
	throw new Error('the web variant must not load expo-media-control');
});

describe('useMediaSession (web)', () => {
	it('renders without a player context or media controls', () => {
		expect(() => renderHook(() => useMediaSession())).not.toThrow();
	});
});
