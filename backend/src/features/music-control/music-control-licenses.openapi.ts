import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { deviceNotFound } from '@/features/music-control/music-control-devices.openapi.js';
import {
	controllableDevicesSchema,
	grantDeviceLicenseResponseSchema,
} from '@/features/music-control/music-control-responses.validators.js';
import {
	deviceLicenseParamsSchema,
	userDevicesParamsSchema,
} from '@/features/music-control/music-control.validators.js';
import { bearerAuth, describeParams, ok, okMessage } from '@/shared/config/swagger.schemas.js';
import { fail, shared } from '@/shared/config/swagger.errors.js';

/** Registers the per-device license routes of /api/music-control (story 4.4, #294). */
export function registerLicenseOpenapi(registry: OpenAPIRegistry): void {
	const common = { tags: ['Music Control'], security: bearerAuth };
	const unauthorized = shared('UnauthorizedError');
	const validation = shared('ValidationError');
	const license = (description: string) =>
		describeParams(deviceLicenseParamsSchema, { userId: description });

	registry.registerPath({
		...common,
		method: 'post',
		path: '/api/music-control/devices/{deviceId}/licenses/{userId}',
		summary: 'Grant a friend control of one of my devices',
		description:
			'Lets a mutual friend control music playback on one of your devices. Idempotent: granting an existing license returns 200 with that license.',
		operationId: 'grantDeviceLicense',
		request: { params: license('Friend user ID to license on the device') },
		responses: {
			200: ok('License granted (or already granted)', grantDeviceLicenseResponseSchema),
			400: fail(
				'Cannot grant the license. `error.code` is `NOT_FRIENDS` (not mutual friends), `CANNOT_LICENSE_SELF` (userId is you) or `VALIDATION_ERROR` (malformed path parameter).',
				['NOT_FRIENDS', 'You can only grant control to mutual friends'],
				['CANNOT_LICENSE_SELF', 'You cannot license yourself on your own device']
			),
			401: unauthorized,
			404: deviceNotFound,
		},
	});

	registry.registerPath({
		...common,
		method: 'delete',
		path: '/api/music-control/devices/{deviceId}/licenses/{userId}',
		summary: 'Revoke a friend from one of my devices',
		description:
			'Removes the license of a friend on one of your devices. Idempotent: answers 200 for any valid userId when no such license exists, including yourself and non-friends. Its only error codes are `VALIDATION_ERROR` (400) and `DEVICE_NOT_FOUND` (404).',
		operationId: 'revokeDeviceLicense',
		request: { params: license('Friend user ID to revoke from the device') },
		responses: {
			200: okMessage('License revoked (or did not exist)', 'Device license revoked successfully'),
			400: validation,
			401: unauthorized,
			404: deviceNotFound,
		},
	});

	registry.registerPath({
		...common,
		method: 'get',
		path: '/api/music-control/users/{userId}/devices',
		summary: "List a friend's devices I can control",
		description:
			'When `allDevices` is true (the friend turned on "all my devices" for you), every device of the friend is listed with `access: all-devices`. Otherwise only the devices licensed to you are listed, with `access: license`. When you and userId are not mutual friends, `allDevices` is false and `devices` is [] (even if a stale "all my devices" flag remains); the same empty answer comes when nothing is granted, so the response never reveals whether the user exists or how many devices they have. Calling it with your own `userId` returns all your devices with `access: all-devices` (#294).',
		operationId: 'getControllableDevices',
		request: {
			params: describeParams(userDevicesParamsSchema, {
				userId: 'Friend user ID whose devices to list',
			}),
		},
		responses: {
			200: ok('Controllable devices retrieved', controllableDevicesSchema),
			400: validation,
			401: unauthorized,
		},
	});
}
