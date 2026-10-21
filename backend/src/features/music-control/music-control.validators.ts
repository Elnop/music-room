import { z } from 'zod';

/**
 * Path parameter schemas for the per-device license operations.
 * A failed parse throws a ZodError, answered as 400 VALIDATION_ERROR.
 */

const deviceIdSchema = z
	.string()
	.min(1, 'deviceId is required')
	.max(128, 'deviceId must be at most 128 characters');

/** POST/DELETE /devices/:deviceId/licenses/:userId */
export const deviceLicenseParamsSchema = z.object({
	deviceId: deviceIdSchema,
	userId: z.uuid('userId must be a UUID'),
});

/** PATCH /devices/:deviceId */
export const deviceParamsSchema = z.object({
	deviceId: deviceIdSchema,
});

/**
 * PATCH /devices/:deviceId body: the name to show, trimmed, 1 to 40
 * characters; null goes back to the system name (#352).
 */
export const renameDeviceSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'name must not be empty')
		.max(40, 'name must be at most 40 characters')
		.nullable(),
});

/** GET /users/:userId/devices */
export const userDevicesParamsSchema = z.object({
	userId: z.uuid('userId must be a UUID'),
});
