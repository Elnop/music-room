import { renderHook } from '@testing-library/react-native';
import { originalTheme } from '@/shared/theme/original.theme';
import { useBottomPadding } from './useBottomPadding';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme: theme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme }) };
});

describe('useBottomPadding', () => {
	it('is only a margin: the screens already end above the mini-player', () => {
		const { result } = renderHook(() => useBottomPadding());
		expect(result.current).toBe(originalTheme.spacing.xl);
	});
});
