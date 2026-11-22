import { GRID_GAP, GRID_PADDING } from '@/shared/theme/configs/gridConfig';
import { tileColumns } from '@/shared/theme/lib/tileColumns';
import type { Breakpoint } from '@/shared/theme/types/layoutTypes';

const GRID_SLACK = 8;

export function tileWidth(contentWidth: number, breakpoint: Breakpoint): number {
	const columns = tileColumns(contentWidth, breakpoint);
	return (contentWidth - 2 * GRID_PADDING - GRID_GAP * (columns - 1) - GRID_SLACK) / columns;
}

export function rowColumns(breakpoint: Breakpoint): number {
	return { phone: 1, tablet: 2, desktop: 3 }[breakpoint];
}
