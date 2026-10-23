let positionReader: (() => number) | null = null;

/** PlayerProvider owns the audio player but listening status is emitted outside it, so the position goes through here. */
export function setPositionReader(reader: (() => number) | null): void {
	positionReader = reader;
}

/** Current playback position in ms, null while no player is registered. */
export function readPositionMs(): number | null {
	return positionReader ? positionReader() : null;
}
