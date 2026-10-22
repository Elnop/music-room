import type { OpenAPIRegistry, ResponseConfig, RouteConfig } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { itemNotFound, playbackRoutes } from '@/features/queue/queue-playback.openapi.js';
import { queueRoutes } from '@/features/queue/queue-routes.openapi.js';
import {
	addQueueItemSchema,
	moveQueueItemSchema,
	queueItemSchema,
	queueOwnerParamsSchema,
	queueStateSchema,
	queueTrackSchema,
	transferResultSchema,
	transferSchema,
} from '@/features/queue/queue.validators.js';
import { bearerAuth, jsonBody, nameSchemas, ok } from '@/shared/config/swagger.schemas.js';
import { fail, shared } from '@/shared/config/swagger.errors.js';

// Play queue (#273, #277): one queue per user, synced across their devices.
// Every endpoint answers the full QueueState and sends it as `queue:updated`
// to the owner's sockets (room `user:<id>`) and to the sockets listening to
// them (room `listening:<id>`). Under /api/users/{userId}/queue a friend who
// controls one of the owner's devices manages the owner's queue (#294); a
// playback action with a `deviceId` also sends `control:command play-item` to
// that device of the owner.

const ownerParams = z.object({
	userId: queueOwnerParamsSchema.shape.userId.unwrap().meta({
		param: { description: 'Id of the queue owner; you must control at least one of their devices' },
	}),
});

const accessDenied = fail(
	'You do not control any device of the owner, or not the chosen `deviceId` (`QUEUE_ACCESS_DENIED`)',
	['QUEUE_ACCESS_DENIED', "Not authorized to manage this user's queue"]
);

const deviceIdRequired = fail(
	'Invalid input, or `deviceId` missing from a delegate (`DEVICE_ID_REQUIRED`)',
	['DEVICE_ID_REQUIRED', 'A delegate must name the device to play on']
);

/** The same operation under /api/users/{userId}/queue, for a delegate (#294). */
function delegated(route: RouteConfig): RouteConfig {
	const own403 = route.responses[403] as ResponseConfig | undefined;
	const params = route.request?.params as z.ZodObject | undefined;
	return {
		...route,
		path: route.path.replace('/api/queue', '/api/users/{userId}/queue'),
		summary: `${route.summary} (queue of a friend you control)`,
		operationId: `${route.operationId}ForUser`,
		request: { ...route.request, params: params ? ownerParams.extend(params.shape) : ownerParams },
		responses: {
			...route.responses,
			// A delegate must name the device (400) and may lack access (403).
			...(playbackRoutes.includes(route) && { 400: deviceIdRequired }),
			403: own403
				? { ...own403, description: `${own403.description}; ${accessDenied.description}` }
				: accessDenied,
		},
	};
}

/** Registers the /api/queue routes, their /api/users/{userId}/queue mirrors and the transfer. */
export function registerQueueOpenapi(registry: OpenAPIRegistry): void {
	nameSchemas({
		QueueTrack: queueTrackSchema,
		QueueItem: queueItemSchema,
		QueueState: queueStateSchema,
		TransferResult: transferResultSchema,
		AddQueueItemRequest: addQueueItemSchema,
		MoveQueueItemRequest: moveQueueItemSchema,
		TransferRequest: transferSchema,
	});
	for (const route of queueRoutes) registry.registerPath(route);
	for (const route of queueRoutes) registry.registerPath(delegated(route));

	// A transfer always starts from the caller, so it has no /api/users/{userId} mirror.
	registry.registerPath({
		method: 'post',
		path: '/api/queue/transfer',
		tags: ['Queue'],
		security: bearerAuth,
		summary: "Transfer playback to one of your devices or a friend's",
		description:
			"Checked in this order, before anything changes: the target device (you own it, or have its license; it must be online), the `source` device (you must control it; offline is fine), and `playing.queueItemId` (must be in your own queue). **Target is one of your devices**: your queue is unchanged and the device gets `control:command` `play-item` (item of your queue) or `play-track` (`playing.track`, played outside the queue) at `positionMs`; `queue` is null. **Target is a friend's device**: the played track and the items that follow it in your queue (or `playing.track` then your upcoming items) are inserted as one block right after the friend's current item and the block's first item becomes current; the friend's sockets get `queue:updated`, the device gets `play-item`, and `queue` is the friend's new queue. If `source` is given, it then gets `control:command` `pause`.",
		operationId: 'queueTransfer',
		request: { body: jsonBody(transferSchema) },
		responses: {
			200: ok('Playback was ordered on the target device', transferResultSchema),
			400: shared('ValidationError'),
			401: shared('UnauthorizedError'),
			403: fail(
				'You do not control the target device or the `source` device (`QUEUE_ACCESS_DENIED`)',
				['QUEUE_ACCESS_DENIED', "Not authorized to manage this user's queue"]
			),
			404: itemNotFound,
			409: fail(
				'The target device is not connected (`DEVICE_OFFLINE`), or there is nothing to transfer (`QUEUE_BLOCK_EMPTY`); no queue changed',
				['DEVICE_OFFLINE', 'Target device is not online']
			),
		},
	});
}
