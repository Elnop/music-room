interface PixelRun {
	x: number;
	y: number;
	width: number;
}

/** Each horizontal stretch of `#` in the grid, so a sprite draws one view per stretch, not per pixel. */
export function pixelRuns(rows: readonly string[]): PixelRun[] {
	return rows.flatMap((row, y) =>
		[...row.matchAll(/#+/g)].map(match => ({ x: match.index, y, width: match[0].length }))
	);
}
