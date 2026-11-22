import { GRID_GAP, GRID_PADDING } from '@/shared/theme/configs/gridConfig';
import type { Breakpoint } from '@/shared/theme/types/layoutTypes';

const MIN_TILE_WIDTH = 180;

export function tileColumns(contentWidth: number, breakpoint: Breakpoint): number {
	if (breakpoint === 'phone') return 2;
	const usable = contentWidth - 2 * GRID_PADDING + GRID_GAP;
	return Math.max(2, Math.floor(usable / (MIN_TILE_WIDTH + GRID_GAP)));
}
