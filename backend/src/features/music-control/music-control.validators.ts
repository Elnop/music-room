import { z } from 'zod';

export const deviceIdSchema = z
	.string()
	.min(1, 'deviceId is required')
	.max(128, 'deviceId must be at most 128 characters');

const deviceIdParam = deviceIdSchema.meta({
	param: { description: 'Id of one of your devices (the deviceId the app persists)' },
});

export const deviceLicenseParamsSchema = z.object({
	deviceId: deviceIdParam,
	userId: z.uuid('userId must be a UUID').meta({ param: { description: 'ID of the friend' } }),
});

export const deviceParamsSchema = z.object({
	deviceId: deviceIdParam,
});

/** null restores the system name. */
export const renameDeviceSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'name must not be empty')
		.max(40, 'name must be at most 40 characters')
		.nullable(),
});

export const userDevicesParamsSchema = z.object({
	userId: z.uuid('userId must be a UUID'),
});

/** OpenAPI only: the controller checks the id itself to answer 400 INVALID_USER_ID. */
export const friendParamsSchema = z.object({
	userId: z.uuid().meta({ param: { description: 'ID of the friend' } }),
});
