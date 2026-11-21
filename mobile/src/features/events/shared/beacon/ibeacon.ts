import {
	IBEACON_LENGTH,
	IBEACON_TYPE,
	MEASURED_POWER,
	ZUMIK_BEACON_MAJOR,
	ZUMIK_BEACON_UUID,
} from '@/features/events/shared/beacon/ibeaconConfig';
import type { IBeaconFrame } from '@/features/events/shared/beacon/ibeaconTypes';

function uuidBytes(uuid: string): number[] {
	const hex = uuid.replaceAll('-', '');
	if (!/^[0-9a-f]{32}$/iu.test(hex)) throw new Error(`Invalid UUID: ${uuid}`);
	return Array.from({ length: 16 }, (_, i) => Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16));
}

function uint16(value: number) {
	return [(value >> 8) & 0xff, value & 0xff];
}

export function buildIBeaconPayload(frame: IBeaconFrame): number[] {
	for (const [name, value] of [
		['major', frame.major],
		['minor', frame.minor],
	] as const) {
		if (!Number.isInteger(value) || value < 0 || value > 0xffff) {
			throw new Error(`Invalid ${name}: ${value}`);
		}
	}
	return [
		IBEACON_TYPE,
		IBEACON_LENGTH,
		...uuidBytes(frame.uuid),
		...uint16(frame.major),
		...uint16(frame.minor),
		frame.measuredPower & 0xff,
	];
}

export function eventBeaconFrame(beaconMinor: number): IBeaconFrame {
	return {
		uuid: ZUMIK_BEACON_UUID,
		major: ZUMIK_BEACON_MAJOR,
		minor: beaconMinor,
		measuredPower: MEASURED_POWER,
	};
}

export function zumikBeaconMinor(frame: IBeaconFrame | null): number | null {
	if (!frame || frame.uuid !== ZUMIK_BEACON_UUID || frame.major !== ZUMIK_BEACON_MAJOR) return null;
	return frame.minor;
}
