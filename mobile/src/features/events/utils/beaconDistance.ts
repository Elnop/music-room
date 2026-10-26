/** Path-loss exponent of the log-distance model: 2 in free space, more indoors with bodies around. */
const PATH_LOSS_EXPONENT = 2.5;

/** Weight of a new RSSI reading against the smoothed value: RSSI jumps by several dBm frame to frame. */
const SMOOTHING = 0.3;

/** Distance in metres from the RSSI, with the log-distance model calibrated at one metre. */
export function estimateDistance(rssi: number, measuredPower: number): number {
	return 10 ** ((measuredPower - rssi) / (10 * PATH_LOSS_EXPONENT));
}

/** Exponential moving average; the first reading is taken as is. */
export function smoothRssi(previous: number | undefined, rssi: number): number {
	return previous === undefined ? rssi : previous + SMOOTHING * (rssi - previous);
}

export interface BeaconSighting {
	rssi: number;
	measuredPower: number;
	lastSeen: number;
}

/** Records a frame; returns a new map so React sees the change. */
export function recordSighting(
	sightings: ReadonlyMap<number, BeaconSighting>,
	minor: number,
	frame: { rssi: number; measuredPower: number },
	now: number
): Map<number, BeaconSighting> {
	const next = new Map(sightings);
	next.set(minor, {
		rssi: smoothRssi(sightings.get(minor)?.rssi, frame.rssi),
		measuredPower: frame.measuredPower,
		lastSeen: now,
	});
	return next;
}

/** Drops beacons not heard for `timeoutMs`: a stopped broadcast leaves after a few seconds. */
export function pruneSightings(
	sightings: ReadonlyMap<number, BeaconSighting>,
	now: number,
	timeoutMs: number
): Map<number, BeaconSighting> {
	return new Map([...sightings].filter(([, sighting]) => now - sighting.lastSeen <= timeoutMs));
}
