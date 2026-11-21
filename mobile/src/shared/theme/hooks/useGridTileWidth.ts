import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { useContentWidth } from '@/shared/theme/hooks/useContentWidth';
import { tileWidth } from '@/shared/theme/lib/gridLayout';

export function useGridTileWidth(): number {
	const { breakpoint } = useBreakpoint();
	return tileWidth(useContentWidth(), breakpoint);
}
