import { renderHook } from '@testing-library/react-native';
import { originalTheme } from '@/shared/theme/original.theme';
import { useBottomPadding } from './useBottomPadding';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme: theme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme }) };
});

const mockPlayerHeight = jest.fn(() => 75);
jest.mock('@/shared/services/playbackBridge', () => ({
	usePlayerHeight: () => mockPlayerHeight(),
}));

describe('useBottomPadding', () => {
	it('adds a margin above the mini-player height', () => {
		const { result } = renderHook(() => useBottomPadding());
		expect(result.current).toBe(75 + originalTheme.spacing.xl);
	});

	it('follows a taller mini-player', () => {
		mockPlayerHeight.mockReturnValue(120);
		const { result } = renderHook(() => useBottomPadding());
		expect(result.current).toBe(120 + originalTheme.spacing.xl);
	});
});
