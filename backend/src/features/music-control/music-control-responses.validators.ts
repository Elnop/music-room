import { z } from 'zod';
import { deviceIdSchema } from '@/features/music-control/music-control.validators.js';

export const controlPermissionsSchema = z.object({ allowedUserIds: z.array(z.uuid()) });

export const controlSwitchResultSchema = z.object({
	success: z.literal(true),
	allowedUserId: z.uuid(),
});

export const canControlSchema = z.object({
	canControl: z.boolean().meta({ description: 'True if you can control this user music' }),
	targetUserId: z.uuid(),
});

export const deviceSchema = z.object({
	deviceId: deviceIdSchema.meta({ description: 'Stable id generated and persisted by the app' }),
	deviceName: z.string().meta({
		example: "Léo's Pixel",
		description:
			'Name to show: the one the owner chose (PATCH /api/music-control/devices/{deviceId}), else the system name',
	}),
	platform: z.string().meta({ example: 'android' }),
	model: z.string().meta({ example: 'Pixel 7' }),
	lastSeenAt: z.iso
		.datetime()
		.meta({ description: 'Last authenticated connection from this device' }),
});

export const deviceLicenseSchema = z.object({
	user: z.object({
		id: z.uuid(),
		username: z.string(),
		displayName: z.string().nullable(),
		avatarUrl: z.url().nullable(),
	}),
	grantedAt: z.iso.datetime(),
});

export const controllableDeviceSchema = deviceSchema.extend({
	access: z.enum(['all-devices', 'license']).meta({
		description:
			'`all-devices`: granted by the "all my devices" switch; `license`: granted on this device only',
	}),
});

export const deviceWithLicensesSchema = deviceSchema.extend({
	licenses: z
		.array(deviceLicenseSchema)
		.meta({ description: 'Friends licensed to control this device' }),
});

export const myDevicesSchema = z.object({ devices: z.array(deviceWithLicensesSchema) });

export const renameDeviceResponseSchema = z.object({ device: deviceSchema });

export const controllableDevicesSchema = z.object({
	allDevices: z.boolean().meta({
		description:
			'True if the friend granted you control of all their devices. Always false when you and userId are not mutual friends.',
	}),
	devices: z.array(controllableDeviceSchema),
});

/** Me first, then friends by username. */
export const devicePickerSchema = z.object({
	owners: z.array(
		z.object({
			ownerId: z.uuid(),
			username: z.string(),
			isSelf: z.boolean(),
			devices: z.array(controllableDeviceSchema.extend({ online: z.boolean() })),
		})
	),
});

export const grantDeviceLicenseResponseSchema = z.object({
	deviceId: deviceIdSchema,
	license: deviceLicenseSchema,
});
