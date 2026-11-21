const PATH_LOSS_EXPONENT = 2.5;

const SMOOTHING = 0.3;

export function estimateDistance(rssi: number, measuredPower: number): number {
	return 10 ** ((measuredPower - rssi) / (10 * PATH_LOSS_EXPONENT));
}

export function smoothRssi(previous: number | undefined, rssi: number): number {
	return previous === undefined ? rssi : previous + SMOOTHING * (rssi - previous);
}

export interface BeaconSighting {
	rssi: number;
	measuredPower: number;
	lastSeen: number;
}

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

export function pruneSightings(
	sightings: ReadonlyMap<number, BeaconSighting>,
	now: number,
	timeoutMs: number
): Map<number, BeaconSighting> {
	return new Map([...sightings].filter(([, sighting]) => now - sighting.lastSeen <= timeoutMs));
}
