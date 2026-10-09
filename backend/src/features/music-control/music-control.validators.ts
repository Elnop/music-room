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

/** GET /users/:userId/devices */
export const userDevicesParamsSchema = z.object({
	userId: z.uuid('userId must be a UUID'),
});

export type DeviceLicenseParams = z.infer<typeof deviceLicenseParamsSchema>;
export type UserDevicesParams = z.infer<typeof userDevicesParamsSchema>;
