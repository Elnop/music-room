import { z } from 'zod';

/**
 * Path parameter schemas for the per-device license operations.
 * A failed parse throws a ZodError, answered as 400 VALIDATION_ERROR.
 */

export const deviceIdSchema = z
	.string()
	.min(1, 'deviceId is required')
	.max(128, 'deviceId must be at most 128 characters');

const deviceIdParam = deviceIdSchema.meta({
	param: { description: 'Id of one of your devices (the deviceId the app persists)' },
});

/** POST/DELETE /devices/:deviceId/licenses/:userId */
export const deviceLicenseParamsSchema = z.object({
	deviceId: deviceIdParam,
	userId: z.uuid('userId must be a UUID').meta({ param: { description: 'ID of the friend' } }),
});

/** PATCH /devices/:deviceId */
export const deviceParamsSchema = z.object({
	deviceId: deviceIdParam,
});

/** null goes back to the system name. */
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

/** Path segment of the /permissions and /can-control routes, read with `routeParam` then checked as a UUID. */
export const friendParamsSchema = z.object({
	userId: z.uuid().meta({ param: { description: 'ID of the friend' } }),
});
