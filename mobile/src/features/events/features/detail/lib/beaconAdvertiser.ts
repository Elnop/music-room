import { AdvertiseError } from '@/features/events/features/detail/lib/AdvertiseError';

export function startEventBeacon(_beaconMinor: number): Promise<void> {
	return Promise.reject(new AdvertiseError('unsupported'));
}

export function stopEventBeacon(): void {
	return undefined;
}
