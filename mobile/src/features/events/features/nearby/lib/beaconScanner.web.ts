import type { BeaconFrame, ScannerState } from '@/features/events/features/nearby/nearbyTypes';

export function watchBluetoothState(listener: (state: ScannerState) => void): () => void {
	listener('unsupported');
	return () => undefined;
}

export function scanEventBeacons(_onFrame: (frame: BeaconFrame) => void): () => void {
	return () => undefined;
}
