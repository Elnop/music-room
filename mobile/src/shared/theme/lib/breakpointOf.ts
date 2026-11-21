import { BREAKPOINTS } from '@/shared/theme/configs/layoutConfig';
import type { Breakpoint } from '@/shared/theme/types/layoutTypes';

export function breakpointOf(width: number): Breakpoint {
	if (width >= BREAKPOINTS.desktop) return 'desktop';
	if (width >= BREAKPOINTS.tablet) return 'tablet';
	return 'phone';
}
