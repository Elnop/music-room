const SMOOTHING = 0.3;

export function smoothRssi(previous: number | undefined, rssi: number): number {
	return previous === undefined ? rssi : previous + SMOOTHING * (rssi - previous);
}
