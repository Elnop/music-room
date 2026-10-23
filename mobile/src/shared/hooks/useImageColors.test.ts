import { renderHook, waitFor } from '@testing-library/react-native';
import { getColors } from 'react-native-image-colors';
import { FIXED_COLORS } from '@/shared/theme/tokens';
import { originalTheme } from '@/shared/theme/original.theme';
import { useImageColors } from './useImageColors';

jest.mock('react-native-image-colors', () => ({ getColors: jest.fn() }));

const FALLBACK_COLOR = FIXED_COLORS.shadow;
const EXTRACTED_COLOR = originalTheme.colors.primary;

describe('useImageColors', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('returns fallback color when url is null', () => {
		const { result } = renderHook(() => useImageColors(null, FALLBACK_COLOR));
		expect(result.current.dominantColor).toBeNull();
		expect(result.current.isLoading).toBe(false);
	});

	it('extracts color when getColors succeeds', async () => {
		(getColors as jest.Mock).mockResolvedValueOnce({
			platform: 'ios',
			primary: EXTRACTED_COLOR,
		});

		const { result } = renderHook(() =>
			useImageColors('https://example.com/art.jpg', FALLBACK_COLOR)
		);

		await waitFor(() => {
			expect(result.current.dominantColor).toBe(EXTRACTED_COLOR);
		});
	});
});
