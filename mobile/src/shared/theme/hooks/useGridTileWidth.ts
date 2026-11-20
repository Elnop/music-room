import { useBreakpoint } from './useBreakpoint';
import { useContentWidth } from './useContentWidth';
import { tileWidth } from '@/shared/theme/lib/gridLayout';

export function useGridTileWidth(): number {
	const { breakpoint } = useBreakpoint();
	return tileWidth(useContentWidth(), breakpoint);
}
