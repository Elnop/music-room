// Browser variant: a browser cannot scan Bluetooth advertisements, so the scan reports
// "unsupported" and the nearby screen keeps to the location.

interface BeaconFrame {
	minor: number;
	rssi: number;
	measuredPower: number;
}

export type ScannerState = 'on' | 'off' | 'unsupported';

/** True, so the screen never offers a permission it cannot get. */
export function requestScanPermission(): Promise<boolean> {
	return Promise.resolve(true);
}

export function hasScanPermission(): Promise<boolean> {
	return Promise.resolve(true);
}

export function watchBluetoothState(listener: (state: ScannerState) => void): () => void {
	listener('unsupported');
	return () => undefined;
}

export function scanEventBeacons(_onFrame: (frame: BeaconFrame) => void): () => void {
	return () => undefined;
}
