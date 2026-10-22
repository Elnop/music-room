import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { registerDeviceOpenapi } from '@/features/music-control/music-control-devices.openapi.js';
import {
	canControlSchema,
	controlPermissionsSchema,
	controlSwitchResultSchema,
} from '@/features/music-control/music-control-responses.validators.js';
import { friendParamsSchema } from '@/features/music-control/music-control.validators.js';
import { bearerAuth, describeParams, ok } from '@/shared/config/swagger.schemas.js';
import { fail, shared } from '@/shared/config/swagger.errors.js';

const invalidUserId = fail('userId is not a UUID', ['INVALID_USER_ID', 'Invalid user ID format']);

/** Registers the /api/music-control routes. */
export function registerMusicControlOpenapi(registry: OpenAPIRegistry): void {
	const common = { tags: ['Music Control'], security: bearerAuth };
	const unauthorized = shared('UnauthorizedError');
	const friend = (description: string) =>
		describeParams(friendParamsSchema, { userId: description });

	registry.registerPath({
		...common,
		method: 'get',
		path: '/api/music-control/permissions',
		summary: 'Get the friends you granted music control',
		description:
			'Returns the IDs of the friends you let control all your devices (the "all my devices" switch)',
		operationId: 'getMusicControlPermissions',
		responses: {
			200: ok('Permissions retrieved', controlPermissionsSchema),
			401: unauthorized,
		},
	});

	registry.registerPath({
		...common,
		method: 'post',
		path: '/api/music-control/permissions/{userId}',
		summary: 'Grant music control to a friend',
		description:
			'Allows a friend to control your music playback (play, pause, skip, change tracks)',
		operationId: 'grantMusicControl',
		request: { params: friend('Friend user ID to grant control to') },
		responses: {
			200: ok('Music control granted', controlSwitchResultSchema),
			400: fail('Cannot grant control (not following, or userId is not a UUID: `INVALID_USER_ID`)'),
			401: unauthorized,
			404: shared('NotFoundError'),
		},
	});

	registry.registerPath({
		...common,
		method: 'delete',
		path: '/api/music-control/permissions/{userId}',
		summary: 'Revoke music control from a friend',
		description: 'Removes music control permissions from a friend',
		operationId: 'revokeMusicControl',
		request: { params: friend('Friend user ID to revoke control from') },
		responses: {
			200: ok('Music control revoked', controlSwitchResultSchema),
			400: invalidUserId,
			401: unauthorized,
			404: shared('NotFoundError'),
		},
	});

	registry.registerPath({
		...common,
		method: 'get',
		path: '/api/music-control/can-control/{userId}',
		summary: "Check if you can control a user's music",
		description:
			'Returns whether authenticated user has permission to control target user music playback',
		operationId: 'canControlUserMusic',
		request: { params: friend('User ID to check control permission for') },
		responses: {
			200: ok('Control status retrieved', canControlSchema),
			400: invalidUserId,
			401: unauthorized,
			404: shared('NotFoundError'),
		},
	});

	registerDeviceOpenapi(registry);
}
