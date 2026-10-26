import type { Breakpoint } from '@/shared/hooks/useBreakpoint';

const GRID_PADDING = 16;
const GRID_GAP = 16;
/** Slack the phone grid has always kept, so two cards never wrap on a rounding error. */
const GRID_SLACK = 8;
const MIN_TILE_WIDTH = 180;

/** Square tiles (playlist covers): two on the phone, as many as fit on wider screens. */
export function tileColumns(contentWidth: number, breakpoint: Breakpoint): number {
	if (breakpoint === 'phone') return 2;
	const usable = contentWidth - 2 * GRID_PADDING + GRID_GAP;
	return Math.max(2, Math.floor(usable / (MIN_TILE_WIDTH + GRID_GAP)));
}

export function tileWidth(contentWidth: number, breakpoint: Breakpoint): number {
	const columns = tileColumns(contentWidth, breakpoint);
	return (contentWidth - 2 * GRID_PADDING - GRID_GAP * (columns - 1) - GRID_SLACK) / columns;
}

/** Rows (friends, events) stay one column on the phone and become cards side by side on wider screens. */
export function rowColumns(breakpoint: Breakpoint): number {
	return { phone: 1, tablet: 2, desktop: 3 }[breakpoint];
}
