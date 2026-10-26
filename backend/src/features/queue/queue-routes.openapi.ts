import type { RouteConfig } from '@asteasolutions/zod-to-openapi';
import {
	answers,
	base,
	itemNotFound,
	playbackRoutes,
	trackUnavailable,
} from '@/features/queue/queue-playback.openapi.js';
import {
	addQueueItemBodySchema,
	moveQueueItemSchema,
	queueItemParamsSchema,
} from '@/features/queue/queue.validators.js';
import { jsonBody } from '@/shared/config/swagger.schemas.js';
import { fail } from '@/shared/config/swagger.errors.js';

/** Mirrored under /api/users/{userId}/queue. */
export const queueRoutes: RouteConfig[] = [
	{
		...base,
		method: 'get',
		path: '/api/queue',
		summary: 'Get your play queue',
		description:
			'Returns `{ ownerId, version: 0, currentItemId: null, items: [] }` when you never queued anything.',
		operationId: 'getQueue',
		responses: { 200: answers[200], 401: answers[401] },
	},
	{
		...base,
		path: '/api/queue/items',
		summary: 'Add a track to the queue',
		description:
			'Appends after the last item; the current item does not change. With `next: true`, the item is placed right after the current item instead (at the top when nothing is current), in one call that publishes one state.',
		operationId: 'addQueueItem',
		request: {
			body: jsonBody(
				addQueueItemBodySchema.meta({
					description: 'A sent `previewUrl` is ignored: the queue never stores a stream URL.',
				})
			),
		},
		responses: { ...answers, 409: trackUnavailable },
	},
	{
		...base,
		method: 'delete',
		path: '/api/queue/items/{itemId}',
		summary: 'Remove an item from the queue',
		description:
			'Removing the current item acts as a skip: the next item of an available track becomes current; with no next item the queue is emptied, history included. Removing an item of a block detaches the whole block.',
		operationId: 'removeQueueItem',
		request: { params: queueItemParamsSchema },
		responses: { ...answers, 404: itemNotFound },
	},
	{
		...base,
		path: '/api/queue/items/{itemId}/move',
		summary: 'Move an upcoming item',
		description:
			'Places the item right after `afterItemId` (`null`: right after the current item, or at the top when nothing is current). Moving an item of a block detaches the whole block.',
		operationId: 'moveQueueItem',
		request: {
			params: queueItemParamsSchema,
			body: jsonBody(moveQueueItemSchema, { afterItemId: null }),
		},
		responses: {
			...answers,
			404: itemNotFound,
			409: fail(
				'The item or `afterItemId` is the current item or in the history (`QUEUE_ITEM_NOT_UPCOMING`)',
				['QUEUE_ITEM_NOT_UPCOMING', 'Only upcoming items can be moved, after an upcoming item']
			),
		},
	},
	...playbackRoutes,
];
