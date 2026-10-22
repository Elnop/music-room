import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
	controllableDeviceSchema,
	controllableDevicesSchema,
	deviceLicenseSchema,
	devicePickerSchema,
	deviceSchema,
	deviceWithLicensesSchema,
	grantDeviceLicenseResponseSchema,
	myDevicesSchema,
	renameDeviceResponseSchema,
} from '@/features/music-control/music-control-responses.validators.js';
import {
	deviceLicenseParamsSchema,
	deviceParamsSchema,
	renameDeviceSchema,
	userDevicesParamsSchema,
} from '@/features/music-control/music-control.validators.js';
import {
	bearerAuth,
	describeParams,
	jsonBody,
	nameSchemas,
	ok,
	okMessage,
} from '@/shared/config/swagger.schemas.js';
import { fail, shared } from '@/shared/config/swagger.errors.js';

const deviceNotFound = fail('The device is not one of yours (`error.code`: `DEVICE_NOT_FOUND`)', [
	'DEVICE_NOT_FOUND',
	'Device not found',
]);

/** Registers the per-device routes of /api/music-control (#294, #295, #352). */
export function registerDeviceOpenapi(registry: OpenAPIRegistry): void {
	const common = { tags: ['Music Control'], security: bearerAuth };
	const unauthorized = shared('UnauthorizedError');
	const validation = shared('ValidationError');
	const license = (description: string) =>
		describeParams(deviceLicenseParamsSchema, { userId: description });
	nameSchemas({
		Device: deviceSchema,
		DeviceLicense: deviceLicenseSchema,
		DeviceWithLicenses: deviceWithLicensesSchema,
		ControllableDevice: controllableDeviceSchema,
		DevicePickerResponse: devicePickerSchema,
	});

	registry.registerPath({
		...common,
		method: 'get',
		path: '/api/music-control/devices',
		summary: 'List my devices and their licenses',
		description:
			'Returns the devices you have connected from, each with the friends licensed to control it. The "all my devices" switch (/permissions) is not reflected here.',
		operationId: 'getMyDevices',
		responses: { 200: ok('Devices retrieved', myDevicesSchema), 401: unauthorized },
	});

	registry.registerPath({
		...common,
		method: 'patch',
		path: '/api/music-control/devices/{deviceId}',
		summary: 'Rename one of my devices',
		description:
			"Sets the name shown for one of your devices (#352), everywhere a device is listed (`deviceName` in your devices, the device picker, a friend's view) and on its live socket. The name is trimmed and must be 1 to 40 characters; `null` goes back to the system name the app sends at each connection. Reconnecting never overwrites the chosen name.",
		operationId: 'renameDevice',
		request: { params: deviceParamsSchema, body: jsonBody(renameDeviceSchema, { name: 'Salon' }) },
		responses: {
			200: ok('Device renamed', renameDeviceResponseSchema),
			400: validation,
			401: unauthorized,
			404: deviceNotFound,
		},
	});

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
		path: '/api/music-control/controllable-devices',
		summary: "List the devices I can play on, mine then my friends'",
		description:
			'Device picker for playback transfer (#295). The first owner is the caller (`isSelf: true`, every device, `access: all-devices`). Then come the mutual friends who let the caller control at least one device (all of them with the "all my devices" switch, otherwise only the licensed ones), ordered by username; other friends and non-friends never appear. `online` is whether the device currently has a live socket.',
		operationId: 'getDevicePicker',
		responses: { 200: ok('Controllable devices retrieved', devicePickerSchema), 401: unauthorized },
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
