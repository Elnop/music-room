import {
	APPLE_COMPANY_ID,
	IBEACON_LENGTH,
	IBEACON_TYPE,
} from '@/features/events/shared/beacon/ibeaconConfig';
import type { IBeaconFrame } from '@/features/events/shared/beacon/ibeaconTypes';

function hex(bytes: number[]) {
	return bytes.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function formatUuid(bytes: number[]): string {
	const h = hex(bytes);
	return [h.slice(0, 8), h.slice(8, 12), h.slice(12, 16), h.slice(16, 20), h.slice(20)].join('-');
}

function toSigned(byte: number) {
	return byte > 127 ? byte - 256 : byte;
}

export function parseIBeacon(data: number[]): IBeaconFrame | null {
	if (data.length < 25) return null;
	const companyId = data[0] | (data[1] << 8);
	if (companyId !== APPLE_COMPANY_ID || data[2] !== IBEACON_TYPE || data[3] !== IBEACON_LENGTH) {
		return null;
	}
	return {
		uuid: formatUuid(data.slice(4, 20)),
		major: (data[20] << 8) | data[21],
		minor: (data[22] << 8) | data[23],
		measuredPower: toSigned(data[24]),
	};
}
