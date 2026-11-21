import * as beaconScanner from '@/features/events/features/nearby/lib/beaconScanner.web';
import * as scanPermission from '@/features/events/features/nearby/lib/scanPermission.web';

jest.mock('react-native-ble-plx', () => {
	throw new Error('the web variant must not load the BLE library');
});

describe('beaconScanner (web)', () => {
	it('grants the permission, so the screen never asks for it', async () => {
		await expect(scanPermission.hasScanPermission()).resolves.toBe(true);
		await expect(scanPermission.requestScanPermission()).resolves.toBe(true);
	});

	it('reports Bluetooth as unsupported and never hears a beacon', () => {
		const listener = jest.fn();
		const onFrame = jest.fn();
		beaconScanner.watchBluetoothState(listener)();
		beaconScanner.scanEventBeacons(onFrame)();
		expect(listener).toHaveBeenCalledWith('unsupported');
		expect(onFrame).not.toHaveBeenCalled();
	});
});
