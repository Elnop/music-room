import { BleManager, ScanMode, State } from 'react-native-ble-plx';
import { logger } from '@/shared/logging/logger';
import { base64ToBytes } from '@/features/events/features/nearby/lib/base64ToBytes';
import { zumikBeaconMinor } from '@/features/events/shared/beacon/ibeacon';
import { parseIBeacon } from '@/features/events/features/nearby/lib/parseIBeacon';
import type { BeaconFrame, ScannerState } from '@/features/events/features/nearby/nearbyTypes';

let manager: BleManager | null = null;
function bleManager() {
	return (manager ??= new BleManager());
}

export function watchBluetoothState(listener: (state: ScannerState) => void): () => void {
	const subscription = bleManager().onStateChange(state => {
		if (state === State.PoweredOn) listener('on');
		else if (state === State.Unsupported || state === State.Unauthorized) listener('unsupported');
		else if (state !== State.Unknown && state !== State.Resetting) listener('off');
	}, true);
	return () => subscription.remove();
}

export function scanEventBeacons(onFrame: (frame: BeaconFrame) => void): () => void {
	const ble = bleManager();
	void ble.startDeviceScan(
		null,
		{ allowDuplicates: true, scanMode: ScanMode.LowLatency },
		(error, device) => {
			if (error) {
				logger.warn('[beaconScanner] Scan failed:', error);
				return;
			}
			if (!device?.manufacturerData || device.rssi === null) return;
			const frame = parseIBeacon(base64ToBytes(device.manufacturerData));
			const minor = zumikBeaconMinor(frame);
			if (frame && minor !== null) {
				onFrame({ minor, rssi: device.rssi, measuredPower: frame.measuredPower });
			}
		}
	);
	return () => void ble.stopDeviceScan();
}
