import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { useContentWidth } from '@/shared/hooks/useContentWidth';
import { tileWidth } from '@/shared/utils/gridLayout';

/** The width of a square grid tile (playlist cover) in the current screen. */
export function useGridTileWidth(): number {
	const { breakpoint } = useBreakpoint();
	return tileWidth(useContentWidth(), breakpoint);
}
