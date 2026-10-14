import { OpenAPIV3 } from 'openapi-types';

/** Path parameter: one of the caller's devices (devices.device_id, migration 015) */
const deviceIdParam: OpenAPIV3.ParameterObject = {
	in: 'path',
	name: 'deviceId',
	required: true,
	schema: { type: 'string', minLength: 1, maxLength: 128 },
	description: 'Id of one of your devices (the deviceId the app persists)',
};

/** 404 when the deviceId is not one of the caller's devices */
const deviceNotFoundResponse: OpenAPIV3.ResponseObject = {
	description: 'The device is not one of yours (`error.code`: `DEVICE_NOT_FOUND`)',
	content: {
		'application/json': {
			schema: { $ref: '#/components/schemas/ErrorResponse' },
			example: {
				success: false,
				error: { message: 'Device not found', code: 'DEVICE_NOT_FOUND' },
				meta: { timestamp: '2026-10-08T12:00:00.000Z' },
			},
		},
	},
};

/**
 * OpenAPI paths for Music Control Delegation feature
 */
export const musicControlPaths: OpenAPIV3.PathsObject = {
	'/api/music-control/permissions': {
		get: {
			tags: ['Music Control'],
			summary: 'Get users who granted you music control',
			description: 'Returns list of friends who have delegated music control permissions to you',
			operationId: 'getMusicControlPermissions',
			security: [{ bearerAuth: [] }],
			responses: {
				'200': {
					description: 'Permissions retrieved',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: {
												type: 'object',
												properties: {
													permissions: {
														type: 'array',
														items: { $ref: '#/components/schemas/MusicControlPermission' },
													},
												},
											},
										},
									},
								],
							},
						},
					},
				},
				'401': { $ref: '#/components/responses/UnauthorizedError' },
			},
		},
	},

	'/api/music-control/permissions/{userId}': {
		post: {
			tags: ['Music Control'],
			summary: 'Grant music control to a friend',
			description:
				'Allows a friend to control your music playback (play, pause, skip, change tracks)',
			operationId: 'grantMusicControl',
			security: [{ bearerAuth: [] }],
			parameters: [
				{
					in: 'path',
					name: 'userId',
					required: true,
					schema: { type: 'string', format: 'uuid' },
					description: 'Friend user ID to grant control to',
				},
			],
			responses: {
				'200': {
					description: 'Music control granted',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: {
												type: 'object',
												properties: {
													message: {
														type: 'string',
														example: 'Music control granted successfully',
													},
												},
											},
										},
									},
								],
							},
						},
					},
				},
				'400': {
					description: 'Cannot grant control (not following or other validation error)',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
						},
					},
				},
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'404': { $ref: '#/components/responses/NotFoundError' },
			},
		},
		delete: {
			tags: ['Music Control'],
			summary: 'Revoke music control from a friend',
			description: 'Removes music control permissions from a friend',
			operationId: 'revokeMusicControl',
			security: [{ bearerAuth: [] }],
			parameters: [
				{
					in: 'path',
					name: 'userId',
					required: true,
					schema: { type: 'string', format: 'uuid' },
					description: 'Friend user ID to revoke control from',
				},
			],
			responses: {
				'200': {
					description: 'Music control revoked',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: {
												type: 'object',
												properties: {
													message: {
														type: 'string',
														example: 'Music control revoked successfully',
													},
												},
											},
										},
									},
								],
							},
						},
					},
				},
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'404': { $ref: '#/components/responses/NotFoundError' },
			},
		},
	},

	'/api/music-control/can-control/{userId}': {
		get: {
			tags: ['Music Control'],
			summary: "Check if you can control a user's music",
			description:
				'Returns whether authenticated user has permission to control target user music playback',
			operationId: 'canControlUserMusic',
			security: [{ bearerAuth: [] }],
			parameters: [
				{
					in: 'path',
					name: 'userId',
					required: true,
					schema: { type: 'string', format: 'uuid' },
					description: 'User ID to check control permission for',
				},
			],
			responses: {
				'200': {
					description: 'Control status retrieved',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: {
												type: 'object',
												properties: {
													canControl: {
														type: 'boolean',
														description: 'True if you can control this user music',
													},
													userId: { type: 'string', format: 'uuid' },
												},
											},
										},
									},
								],
							},
						},
					},
				},
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'404': { $ref: '#/components/responses/NotFoundError' },
			},
		},
	},

	'/api/music-control/devices': {
		get: {
			tags: ['Music Control'],
			summary: 'List my devices and their licenses',
			description:
				'Returns the devices you have connected from, each with the friends licensed to control it. The "all my devices" switch (/permissions) is not reflected here.',
			operationId: 'getMyDevices',
			security: [{ bearerAuth: [] }],
			responses: {
				'200': {
					description: 'Devices retrieved',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: {
												type: 'object',
												required: ['devices'],
												properties: {
													devices: {
														type: 'array',
														items: { $ref: '#/components/schemas/DeviceWithLicenses' },
													},
												},
											},
										},
									},
								],
							},
						},
					},
				},
				'401': { $ref: '#/components/responses/UnauthorizedError' },
			},
		},
	},

	'/api/music-control/devices/{deviceId}/licenses/{userId}': {
		post: {
			tags: ['Music Control'],
			summary: 'Grant a friend control of one of my devices',
			description:
				'Lets a mutual friend control music playback on one of your devices. Idempotent: granting an existing license returns 200 with that license.',
			operationId: 'grantDeviceLicense',
			security: [{ bearerAuth: [] }],
			parameters: [
				deviceIdParam,
				{
					in: 'path',
					name: 'userId',
					required: true,
					schema: { type: 'string', format: 'uuid' },
					description: 'Friend user ID to license on the device',
				},
			],
			responses: {
				'200': {
					description: 'License granted (or already granted)',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: {
												type: 'object',
												required: ['deviceId', 'license'],
												properties: {
													deviceId: { type: 'string', minLength: 1, maxLength: 128 },
													license: { $ref: '#/components/schemas/DeviceLicense' },
												},
											},
										},
									},
								],
							},
						},
					},
				},
				'400': {
					description:
						'Cannot grant the license. `error.code` is `NOT_FRIENDS` (not mutual friends), `CANNOT_LICENSE_SELF` (userId is you) or `VALIDATION_ERROR` (malformed path parameter).',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							examples: {
								notFriends: {
									value: {
										success: false,
										error: {
											message: 'You can only grant control to mutual friends',
											code: 'NOT_FRIENDS',
										},
										meta: { timestamp: '2026-10-08T12:00:00.000Z' },
									},
								},
								self: {
									value: {
										success: false,
										error: {
											message: 'You cannot license yourself on your own device',
											code: 'CANNOT_LICENSE_SELF',
										},
										meta: { timestamp: '2026-10-08T12:00:00.000Z' },
									},
								},
							},
						},
					},
				},
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'404': deviceNotFoundResponse,
			},
		},
		delete: {
			tags: ['Music Control'],
			summary: 'Revoke a friend from one of my devices',
			description:
				'Removes the license of a friend on one of your devices. Idempotent: answers 200 for any valid userId when no such license exists, including yourself and non-friends. Its only error codes are `VALIDATION_ERROR` (400) and `DEVICE_NOT_FOUND` (404).',
			operationId: 'revokeDeviceLicense',
			security: [{ bearerAuth: [] }],
			parameters: [
				deviceIdParam,
				{
					in: 'path',
					name: 'userId',
					required: true,
					schema: { type: 'string', format: 'uuid' },
					description: 'Friend user ID to revoke from the device',
				},
			],
			responses: {
				'200': {
					description: 'License revoked (or did not exist)',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: {
												type: 'object',
												properties: {
													message: {
														type: 'string',
														example: 'Device license revoked successfully',
													},
												},
											},
										},
									},
								],
							},
						},
					},
				},
				'400': { $ref: '#/components/responses/ValidationError' },
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'404': deviceNotFoundResponse,
			},
		},
	},

	'/api/music-control/controllable-devices': {
		get: {
			tags: ['Music Control'],
			summary: "List the devices I can play on, mine then my friends'",
			description:
				'Device picker for playback transfer (#295). The first owner is the caller (`isSelf: true`, every device, `access: all-devices`). Then come the mutual friends who let the caller control at least one device (all of them with the "all my devices" switch, otherwise only the licensed ones), ordered by username; other friends and non-friends never appear. `online` is whether the device currently has a live socket.',
			operationId: 'getDevicePicker',
			security: [{ bearerAuth: [] }],
			responses: {
				'200': {
					description: 'Controllable devices retrieved',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/DevicePickerResponse' },
										},
									},
								],
							},
							example: {
								success: true,
								data: {
									owners: [
										{
											ownerId: '3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f',
											username: 'me',
											isSelf: true,
											devices: [
												{
													deviceId: 'phone-1',
													deviceName: 'My phone',
													platform: 'android',
													model: 'Pixel 7',
													lastSeenAt: '2026-10-14T10:00:00.000Z',
													access: 'all-devices',
													online: true,
												},
											],
										},
										{
											ownerId: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
											username: 'alice',
											isSelf: false,
											devices: [
												{
													deviceId: 'tv-1',
													deviceName: 'Living room TV',
													platform: 'android',
													model: 'Shield',
													lastSeenAt: '2026-10-14T09:30:00.000Z',
													access: 'license',
													online: false,
												},
											],
										},
									],
								},
								meta: { timestamp: '2026-10-14T10:00:05.000Z' },
							},
						},
					},
				},
				'401': { $ref: '#/components/responses/Unauthorized' },
			},
		},
	},

	'/api/music-control/users/{userId}/devices': {
		get: {
			tags: ['Music Control'],
			summary: "List a friend's devices I can control",
			description:
				'When `allDevices` is true (the friend turned on "all my devices" for you), every device of the friend is listed with `access: all-devices`. Otherwise only the devices licensed to you are listed, with `access: license`. When you and userId are not mutual friends, `allDevices` is false and `devices` is [] (even if a stale "all my devices" flag remains); the same empty answer comes when nothing is granted, so the response never reveals whether the user exists or how many devices they have. Calling it with your own `userId` returns all your devices with `access: all-devices` (#294).',
			operationId: 'getControllableDevices',
			security: [{ bearerAuth: [] }],
			parameters: [
				{
					in: 'path',
					name: 'userId',
					required: true,
					schema: { type: 'string', format: 'uuid' },
					description: 'Friend user ID whose devices to list',
				},
			],
			responses: {
				'200': {
					description: 'Controllable devices retrieved',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: {
												type: 'object',
												required: ['allDevices', 'devices'],
												properties: {
													allDevices: {
														type: 'boolean',
														description:
															'True if the friend granted you control of all their devices. Always false when you and userId are not mutual friends.',
													},
													devices: {
														type: 'array',
														items: { $ref: '#/components/schemas/ControllableDevice' },
													},
												},
											},
										},
									},
								],
							},
						},
					},
				},
				'400': { $ref: '#/components/responses/ValidationError' },
				'401': { $ref: '#/components/responses/UnauthorizedError' },
			},
		},
	},
};

/**
 * Schemas specific to Music Control
 */
export const musicControlSchemas: OpenAPIV3.ComponentsObject['schemas'] = {
	MusicControlPermission: {
		type: 'object',
		properties: {
			user: {
				type: 'object',
				properties: {
					id: { type: 'string', format: 'uuid' },
					username: { type: 'string' },
					displayName: { type: 'string', nullable: true },
					avatarUrl: { type: 'string', format: 'uri', nullable: true },
				},
			},
			grantedAt: { type: 'string', format: 'date-time' },
			canControl: {
				type: 'boolean',
				description: 'True if you can control this user music playback',
			},
		},
	},
	Device: {
		type: 'object',
		required: ['deviceId', 'deviceName', 'platform', 'model', 'lastSeenAt'],
		properties: {
			deviceId: {
				type: 'string',
				minLength: 1,
				maxLength: 128,
				description: 'Stable id generated and persisted by the app',
			},
			deviceName: { type: 'string', example: "Léo's Pixel" },
			platform: { type: 'string', example: 'android' },
			model: { type: 'string', example: 'Pixel 7' },
			lastSeenAt: {
				type: 'string',
				format: 'date-time',
				description: 'Last authenticated connection from this device',
			},
		},
	},
	DeviceLicense: {
		type: 'object',
		required: ['user', 'grantedAt'],
		properties: {
			user: {
				type: 'object',
				required: ['id', 'username', 'displayName', 'avatarUrl'],
				properties: {
					id: { type: 'string', format: 'uuid' },
					username: { type: 'string' },
					displayName: { type: 'string', nullable: true },
					avatarUrl: { type: 'string', format: 'uri', nullable: true },
				},
			},
			grantedAt: { type: 'string', format: 'date-time' },
		},
	},
	DeviceWithLicenses: {
		allOf: [
			{ $ref: '#/components/schemas/Device' },
			{
				type: 'object',
				required: ['licenses'],
				properties: {
					licenses: {
						type: 'array',
						description: 'Friends licensed to control this device',
						items: { $ref: '#/components/schemas/DeviceLicense' },
					},
				},
			},
		],
	},
	DevicePickerResponse: {
		type: 'object',
		required: ['owners'],
		properties: {
			owners: {
				type: 'array',
				items: {
					type: 'object',
					required: ['ownerId', 'username', 'isSelf', 'devices'],
					properties: {
						ownerId: { type: 'string', format: 'uuid' },
						username: { type: 'string' },
						isSelf: { type: 'boolean' },
						devices: {
							type: 'array',
							items: {
								allOf: [
									{ $ref: '#/components/schemas/ControllableDevice' },
									{
										type: 'object',
										required: ['online'],
										properties: { online: { type: 'boolean' } },
									},
								],
							},
						},
					},
				},
			},
		},
	},
	ControllableDevice: {
		allOf: [
			{ $ref: '#/components/schemas/Device' },
			{
				type: 'object',
				required: ['access'],
				properties: {
					access: {
						type: 'string',
						enum: ['all-devices', 'license'],
						description:
							'`all-devices`: granted by the "all my devices" switch; `license`: granted on this device only',
					},
				},
			},
		],
	},
};
