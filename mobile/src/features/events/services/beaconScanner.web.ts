interface BeaconFrame {
	minor: number;
	rssi: number;
	measuredPower: number;
}

export type ScannerState = 'on' | 'off' | 'unsupported';

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
