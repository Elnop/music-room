import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
	controllableDeviceSchema,
	deviceLicenseSchema,
	devicePickerSchema,
	deviceSchema,
	deviceWithLicensesSchema,
	myDevicesSchema,
	renameDeviceResponseSchema,
} from '@/features/music-control/music-control-responses.validators.js';
import {
	deviceParamsSchema,
	renameDeviceSchema,
} from '@/features/music-control/music-control.validators.js';
import { bearerAuth, jsonBody, nameSchemas, ok } from '@/shared/config/swagger.schemas.js';
import { fail, shared } from '@/shared/config/swagger.errors.js';

export const deviceNotFound = fail(
	'The device is not one of yours (`error.code`: `DEVICE_NOT_FOUND`)',
	['DEVICE_NOT_FOUND', 'Device not found']
);

/** Registers the device routes of /api/music-control (#294, #295, #352). */
export function registerDeviceOpenapi(registry: OpenAPIRegistry): void {
	const common = { tags: ['Music Control'], security: bearerAuth };
	const unauthorized = shared('UnauthorizedError');
	const validation = shared('ValidationError');
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
		method: 'get',
		path: '/api/music-control/controllable-devices',
		summary: "List the devices I can play on, mine then my friends'",
		description:
			'Device picker for playback transfer (#295). The first owner is the caller (`isSelf: true`, every device, `access: all-devices`). Then come the mutual friends who let the caller control at least one device (all of them with the "all my devices" switch, otherwise only the licensed ones), ordered by username; other friends and non-friends never appear. `online` is whether the device currently has a live socket.',
		operationId: 'getDevicePicker',
		responses: { 200: ok('Controllable devices retrieved', devicePickerSchema), 401: unauthorized },
	});
}
