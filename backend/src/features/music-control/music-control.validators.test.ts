import { describe, expect, it } from 'vitest';
import {
	deviceLicenseParamsSchema,
	userDevicesParamsSchema,
} from '@/features/music-control/music-control.validators.js';

const USER_ID = '3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e';

describe('deviceLicenseParamsSchema', () => {
	it('accepts a deviceId of 1 to 128 characters and a uuid userId', () => {
		expect(deviceLicenseParamsSchema.parse({ deviceId: 'd', userId: USER_ID })).toEqual({
			deviceId: 'd',
			userId: USER_ID,
		});
		expect(
			deviceLicenseParamsSchema.safeParse({ deviceId: 'x'.repeat(128), userId: USER_ID }).success
		).toBe(true);
	});

	it('rejects an empty deviceId', () => {
		expect(deviceLicenseParamsSchema.safeParse({ deviceId: '', userId: USER_ID }).success).toBe(
			false
		);
	});

	it('rejects a deviceId longer than 128 characters', () => {
		expect(
			deviceLicenseParamsSchema.safeParse({ deviceId: 'x'.repeat(129), userId: USER_ID }).success
		).toBe(false);
	});

	it('rejects a malformed userId', () => {
		expect(deviceLicenseParamsSchema.safeParse({ deviceId: 'd', userId: 'bob' }).success).toBe(
			false
		);
	});
});

describe('userDevicesParamsSchema', () => {
	it('accepts a uuid userId', () => {
		expect(userDevicesParamsSchema.parse({ userId: USER_ID })).toEqual({ userId: USER_ID });
	});

	it('rejects a malformed userId', () => {
		expect(userDevicesParamsSchema.safeParse({ userId: 'not-a-uuid' }).success).toBe(false);
		expect(userDevicesParamsSchema.safeParse({}).success).toBe(false);
	});
});
