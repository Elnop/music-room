import { useWindowDimensions } from 'react-native';
import { BREAKPOINTS } from '@/shared/constants/layout';

export type Breakpoint = 'phone' | 'tablet' | 'desktop';

export function breakpointOf(width: number): Breakpoint {
	if (width >= BREAKPOINTS.desktop) return 'desktop';
	if (width >= BREAKPOINTS.tablet) return 'tablet';
	return 'phone';
}

interface BreakpointInfo {
	breakpoint: Breakpoint;
	isWide: boolean;
	isDesktop: boolean;
	width: number;
}

export function useBreakpoint(): BreakpointInfo {
	const { width } = useWindowDimensions();
	const breakpoint = breakpointOf(width);
	return {
		breakpoint,
		isWide: breakpoint !== 'phone',
		isDesktop: breakpoint === 'desktop',
		width,
	};
}
