import { PermissionsAndroid, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { buildIBeaconPayload, eventBeaconFrame } from '@/features/events/shared/beacon/ibeacon';
import { APPLE_COMPANY_ID } from '@/features/events/shared/beacon/ibeaconConfig';
import { AdvertiseError } from '@/features/events/features/detail/lib/AdvertiseError';

type BluetoothState = 'on' | 'off' | 'unsupported';

type BeaconAdvertiserModule = {
	getState: () => BluetoothState;
	start: (manufacturerId: number, data: number[]) => Promise<void>;
	stop: () => void;
};

function nativeModule() {
	return requireOptionalNativeModule<BeaconAdvertiserModule>('BeaconAdvertiser');
}

async function requestAdvertisePermission(): Promise<boolean> {
	if (Number(Platform.Version) < 31) return true;
	const result = await PermissionsAndroid.request(
		PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
		{
			title: 'Diffuser la balise',
			message:
				"Zumik utilise le Bluetooth pour annoncer votre événement aux téléphones proches. Il n'envoie aucune donnée personnelle.",
			buttonPositive: 'Continuer',
		},
	);
	return result === PermissionsAndroid.RESULTS.GRANTED;
}

export async function startEventBeacon(beaconMinor: number): Promise<void> {
	const native = nativeModule();
	if (!native) throw new AdvertiseError('unsupported');
	if (!(await requestAdvertisePermission())) throw new AdvertiseError('permission-denied');
	const state = native.getState();
	if (state === 'unsupported') throw new AdvertiseError('unsupported');
	if (state === 'off') throw new AdvertiseError('bluetooth-off');
	try {
		await native.start(APPLE_COMPANY_ID, buildIBeaconPayload(eventBeaconFrame(beaconMinor)));
	} catch (error) {
		const code = (error as { code?: string }).code;
		throw new AdvertiseError(code === 'PERMISSION_DENIED' ? 'permission-denied' : 'failed', error);
	}
}

export function stopEventBeacon(): void {
	nativeModule()?.stop();
}
