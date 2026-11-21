import { useWindowDimensions } from 'react-native';
import { breakpointOf } from '@/shared/theme/lib/breakpointOf';
import type { Breakpoint } from '@/shared/theme/types/layoutTypes';

type BreakpointInfo = {
	breakpoint: Breakpoint;
	isWide: boolean;
	isDesktop: boolean;
	width: number;
};

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
