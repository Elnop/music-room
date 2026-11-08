import { randomInt } from 'node:crypto';

const BEACON_MINOR_MAX = 65535;
const UNIQUE_VIOLATION = '23505';

export function randomBeaconMinor(): number {
	return randomInt(1, BEACON_MINOR_MAX + 1);
}

export function isBeaconMinorTaken(error: { code?: string; message?: string } | null): boolean {
	return error?.code === UNIQUE_VIOLATION && (error.message ?? '').includes('beacon_minor');
}
