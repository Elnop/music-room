import { randomInt } from 'node:crypto';

const BEACON_MINOR_MAX = 65535;

export function randomBeaconMinor(): number {
	return randomInt(1, BEACON_MINOR_MAX + 1);
}

/** Postgres unique_violation on events.beacon_minor: another event drew the same value. */
export function isBeaconMinorTaken(error: { code?: string; message?: string } | null): boolean {
	return error?.code === '23505' && (error.message ?? '').includes('beacon_minor');
}
