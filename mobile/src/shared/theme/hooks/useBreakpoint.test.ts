import { renderHook } from '@testing-library/react-native';
import { useWindowDimensions } from 'react-native';
import { breakpointOf } from '@/shared/theme/lib/breakpointOf';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
	__esModule: true,
	default: jest.fn(),
}));

function mockWidth(width: number) {
	return jest
		.mocked(useWindowDimensions)
		.mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

describe('breakpointOf', () => {
	it.each([
		[320, 'phone'],
		[375, 'phone'],
		[767, 'phone'],
		[768, 'tablet'],
		[800, 'tablet'],
		[1023, 'tablet'],
		[1024, 'desktop'],
		[1440, 'desktop'],
	])('%i px is %s', (width, expected) => {
		expect(breakpointOf(width)).toBe(expected);
	});
});

describe('useBreakpoint', () => {
	it('keeps the phone layout below the tablet width', () => {
		mockWidth(375);
		const { result } = renderHook(() => useBreakpoint());
		expect(result.current).toStrictEqual({
			breakpoint: 'phone',
			isWide: false,
			isDesktop: false,
			width: 375,
		});
	});

	it('is wide but not desktop on a tablet', () => {
		mockWidth(800);
		const { result } = renderHook(() => useBreakpoint());
		expect(result.current).toMatchObject({ breakpoint: 'tablet', isWide: true, isDesktop: false });
	});

	it('is wide and desktop from 1024 px', () => {
		mockWidth(1440);
		const { result } = renderHook(() => useBreakpoint());
		expect(result.current).toMatchObject({ breakpoint: 'desktop', isWide: true, isDesktop: true });
	});

	it('follows a window resize', () => {
		mockWidth(1440);
		const { result, rerender } = renderHook(() => useBreakpoint());
		mockWidth(600);
		rerender({});
		expect(result.current.breakpoint).toBe('phone');
	});
});
