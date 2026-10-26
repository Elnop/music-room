/** Apple's Bluetooth company identifier: iBeacon frames are its manufacturer-specific data. */
export const APPLE_COMPANY_ID = 0x004c;

/** Identifies Zumik's beacons: a scanner keeps only frames with this UUID. */
export const ZUMIK_BEACON_UUID = '5a554d49-4b00-4e00-8000-6576656e7473';

/** Fixed for every event: the minor alone (`beaconMinor`) tells events apart. */
const ZUMIK_BEACON_MAJOR = 1;

/** RSSI expected at one metre, in dBm: the usual calibration of a phone advertising at high power. */
export const MEASURED_POWER = -59;

const IBEACON_TYPE = 0x02;
const IBEACON_LENGTH = 0x15;

interface IBeaconFrame {
	uuid: string;
	major: number;
	minor: number;
	measuredPower: number;
}

function uuidBytes(uuid: string): number[] {
	const hex = uuid.replace(/-/g, '');
	if (!/^[0-9a-f]{32}$/i.test(hex)) throw new Error(`Invalid UUID: ${uuid}`);
	return Array.from({ length: 16 }, (_, i) => parseInt(hex.slice(i * 2, i * 2 + 2), 16));
}

const uint16 = (value: number) => [(value >> 8) & 0xff, value & 0xff];

/** The 23 bytes after the company ID: type, length, UUID, major and minor (big-endian), measured power. */
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

/** The frame that announces one event. */
export function eventBeaconFrame(beaconMinor: number): IBeaconFrame {
	return {
		uuid: ZUMIK_BEACON_UUID,
		major: ZUMIK_BEACON_MAJOR,
		minor: beaconMinor,
		measuredPower: MEASURED_POWER,
	};
}

const hex = (bytes: number[]) => bytes.map(byte => byte.toString(16).padStart(2, '0')).join('');

function formatUuid(bytes: number[]): string {
	const h = hex(bytes);
	return [h.slice(0, 8), h.slice(8, 12), h.slice(12, 16), h.slice(16, 20), h.slice(20)].join('-');
}

const toSigned = (byte: number) => (byte > 127 ? byte - 256 : byte);

/** Reads manufacturer data that starts with the company ID (little-endian); null when not an iBeacon. */
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

/** The minor of a Zumik event beacon, or null for any other frame. */
export function zumikBeaconMinor(frame: IBeaconFrame | null): number | null {
	if (!frame || frame.uuid !== ZUMIK_BEACON_UUID || frame.major !== ZUMIK_BEACON_MAJOR) return null;
	return frame.minor;
}
