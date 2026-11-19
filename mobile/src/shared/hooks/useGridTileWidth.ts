import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { useContentWidth } from '@/shared/hooks/useContentWidth';
import { tileWidth } from '@/shared/utils/gridLayout';

export function useGridTileWidth(): number {
	const { breakpoint } = useBreakpoint();
	return tileWidth(useContentWidth(), breakpoint);
}
