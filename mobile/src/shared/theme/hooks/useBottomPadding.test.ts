import { renderHook } from '@testing-library/react-native';
import { originalTheme } from '@/shared/theme/configs/originalThemeConfig';
import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';

jest.mock('@/shared/theme/hooks/useTheme', () => {
	const { originalTheme: theme } = jest.requireActual('@/shared/theme/configs/originalThemeConfig');
	return { useTheme: () => ({ theme }) };
});

describe('useBottomPadding', () => {
	it('is only a margin: the screens already end above the mini-player', () => {
		const { result } = renderHook(() => useBottomPadding());
		expect(result.current).toBe(originalTheme.spacing.xl);
	});
});
