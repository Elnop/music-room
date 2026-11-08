import type { Breakpoint } from '@/shared/hooks/useBreakpoint';

const GRID_PADDING = 16;
const GRID_GAP = 16;
const GRID_SLACK = 8;
const MIN_TILE_WIDTH = 180;

export function tileColumns(contentWidth: number, breakpoint: Breakpoint): number {
	if (breakpoint === 'phone') return 2;
	const usable = contentWidth - 2 * GRID_PADDING + GRID_GAP;
	return Math.max(2, Math.floor(usable / (MIN_TILE_WIDTH + GRID_GAP)));
}

export function tileWidth(contentWidth: number, breakpoint: Breakpoint): number {
	const columns = tileColumns(contentWidth, breakpoint);
	return (contentWidth - 2 * GRID_PADDING - GRID_GAP * (columns - 1) - GRID_SLACK) / columns;
}

export function rowColumns(breakpoint: Breakpoint): number {
	return { phone: 1, tablet: 2, desktop: 3 }[breakpoint];
}
