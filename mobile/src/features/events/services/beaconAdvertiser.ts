import { PermissionsAndroid, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import {
	APPLE_COMPANY_ID,
	buildIBeaconPayload,
	eventBeaconFrame,
} from '@/features/events/utils/ibeacon';

// The native side (local module mobile/modules/beacon-advertiser) only broadcasts the bytes it is given.

type BluetoothState = 'on' | 'off' | 'unsupported';

interface BeaconAdvertiserModule {
	getState(): BluetoothState;
	start(manufacturerId: number, data: number[]): Promise<void>;
	stop(): void;
}

const nativeModule = () =>
	Platform.OS === 'android'
		? requireOptionalNativeModule<BeaconAdvertiserModule>('BeaconAdvertiser')
		: null;

export type AdvertiseFailure = 'unsupported' | 'bluetooth-off' | 'permission-denied' | 'failed';

export class AdvertiseError extends Error {
	constructor(
		readonly reason: AdvertiseFailure,
		cause?: unknown
	) {
		super(`Beacon advertising failed: ${reason}`, { cause });
	}
}

/** Android 12+ asks for "Nearby devices" to advertise; older versions grant it at install. */
async function requestAdvertisePermission(): Promise<boolean> {
	if (Platform.OS !== 'android' || Number(Platform.Version) < 31) return true;
	const result = await PermissionsAndroid.request(
		PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
		{
			title: 'Diffuser la balise',
			message:
				"Zumik utilise le Bluetooth pour annoncer votre événement aux téléphones proches. Il n'envoie aucune donnée personnelle.",
			buttonPositive: 'Continuer',
		}
	);
	return result === PermissionsAndroid.RESULTS.GRANTED;
}

/** Broadcasts the iBeacon frame of the event with this minor; throws an AdvertiseError. */
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
