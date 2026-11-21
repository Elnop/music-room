let positionReader: (() => number) | null = null;

export function setPositionReader(reader: (() => number) | null): void {
	positionReader = reader;
}

export function readPositionMs(): number | null {
	return positionReader ? positionReader() : null;
}
