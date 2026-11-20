import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';

export function useShellLayout() {
	const { breakpoint, isWide, isDesktop } = useBreakpoint();
	return { breakpoint, isWide, isDesktop };
}
