import { renderHook } from '@testing-library/react-native';
import { useImageColors } from '@/shared/image-colors/useImageColors.web';

jest.mock('react-native-image-colors', () => {
	throw new Error('the web variant must not load react-native-image-colors');
});

const FALLBACK = 'fallback-colour';

describe('useImageColors (web)', () => {
	it('gives a cover the fallback colour', () => {
		const { result } = renderHook(() => useImageColors('https://example.com/art.jpg', FALLBACK));
		expect(result.current).toEqual({ dominantColor: FALLBACK, isLoading: false });
	});

	it('gives no colour without a cover', () => {
		const { result } = renderHook(() => useImageColors(null, FALLBACK));
		expect(result.current.dominantColor).toBeNull();
	});
});
