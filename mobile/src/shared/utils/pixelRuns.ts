interface PixelRun {
	x: number;
	y: number;
	width: number;
}

export function pixelRuns(rows: readonly string[]): PixelRun[] {
	return rows.flatMap((row, y) =>
		[...row.matchAll(/#+/g)].map(match => ({ x: match.index, y, width: match[0].length }))
	);
}
