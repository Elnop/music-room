import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, ScanMode, State } from 'react-native-ble-plx';
import { logger } from '@/shared/utils/logger';
import { base64ToBytes } from '@/features/events/utils/base64';
import { parseIBeacon, zumikBeaconMinor } from '@/features/events/utils/ibeacon';

// react-native-ble-plx only reports advertisements; decoding the iBeacon frame is project code.

interface BeaconFrame {
	minor: number;
	rssi: number;
	measuredPower: number;
}

export type ScannerState = 'on' | 'off' | 'unsupported';

let manager: BleManager | null = null;
const bleManager = () => (manager ??= new BleManager());

/**
 * Android filters iBeacon frames out of scans declared "neverForLocation", so scanning needs
 * the location permission too, and the location setting on.
 */
export async function requestScanPermission(): Promise<boolean> {
	if (Platform.OS !== 'android') return false;
	const wanted =
		Number(Platform.Version) >= 31
			? [
					PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
					PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
				]
			: [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
	const results = await PermissionsAndroid.requestMultiple(wanted);
	return wanted.every(permission => results[permission] === PermissionsAndroid.RESULTS.GRANTED);
}

export async function hasScanPermission(): Promise<boolean> {
	if (Platform.OS !== 'android') return false;
	const checks = [PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)];
	if (Number(Platform.Version) >= 31) {
		checks.push(PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN));
	}
	return (await Promise.all(checks)).every(Boolean);
}

/** Calls `listener` with the Bluetooth state now and on every change; returns the unsubscribe. */
export function watchBluetoothState(listener: (state: ScannerState) => void): () => void {
	const subscription = bleManager().onStateChange(state => {
		if (state === State.PoweredOn) listener('on');
		else if (state === State.Unsupported || state === State.Unauthorized) listener('unsupported');
		else if (state !== State.Unknown && state !== State.Resetting) listener('off');
	}, true);
	return () => subscription.remove();
}

/** Scans until the returned function is called; only Zumik event beacons reach `onFrame`. */
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
