let positionReader: (() => number) | null = null;

/**
 * Registers how to read the playback position in ms. PlayerProvider owns the audio
 * player but listening status is emitted outside it, so the position goes through here (#295).
 */
export function setPositionReader(reader: (() => number) | null): void {
	positionReader = reader;
}

/** Current playback position in ms, null while no player is registered. */
export function readPositionMs(): number | null {
	return positionReader ? positionReader() : null;
}
