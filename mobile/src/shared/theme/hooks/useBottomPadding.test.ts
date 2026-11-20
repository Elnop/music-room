import { renderHook } from '@testing-library/react-native';
import { originalTheme } from '@/shared/theme/lib/original.theme';
import { useBottomPadding } from './useBottomPadding';

jest.mock('@/shared/theme/components/ThemeContext', () => {
	const { originalTheme: theme } = jest.requireActual('@/shared/theme/lib/original.theme');
	return { useTheme: () => ({ theme }) };
});

describe('useBottomPadding', () => {
	it('is only a margin: the screens already end above the mini-player', () => {
		const { result } = renderHook(() => useBottomPadding());
		expect(result.current).toBe(originalTheme.spacing.xl);
	});
});
