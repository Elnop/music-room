import { OpenAPIV3 } from 'openapi-types';

// Play queue (#273): one queue per user, synced across their devices.
// Every endpoint answers the full QueueState and sends it as `queue:updated`
// to the caller's sockets (room `user:<id>`).

const itemIdParam: OpenAPIV3.ParameterObject = {
	in: 'path',
	name: 'itemId',
	required: true,
	schema: { type: 'string', format: 'uuid' },
	description: 'Id of an item of your queue',
};

function errorResponse(
	description: string,
	code: string,
	message: string
): OpenAPIV3.ResponseObject {
	return {
		description,
		content: {
			'application/json': {
				schema: { $ref: '#/components/schemas/ErrorResponse' },
				example: {
					success: false,
					error: { message, code },
					meta: { timestamp: '2026-10-13T12:00:00.000Z' },
				},
			},
		},
	};
}

const itemNotFound = errorResponse(
	"The item is not in your queue (`QUEUE_ITEM_NOT_FOUND`); another user's item answers the same",
	'QUEUE_ITEM_NOT_FOUND',
	'Queue item not found'
);

const stateResponse: OpenAPIV3.ResponseObject = {
	description: 'The full queue after the operation',
	content: {
		'application/json': {
			schema: {
				allOf: [
					{ $ref: '#/components/schemas/SuccessResponse' },
					{
						type: 'object',
						properties: { data: { $ref: '#/components/schemas/QueueState' } },
					},
				],
			},
		},
	},
};

const common = {
	tags: ['Queue'],
	security: [{ bearerAuth: [] }],
};

export const queuePaths: OpenAPIV3.PathsObject = {
	'/api/queue': {
		get: {
			...common,
			summary: 'Get your play queue',
			description: 'Returns `{ currentItemId: null, items: [] }` when you never queued anything.',
			operationId: 'getQueue',
			responses: {
				'200': stateResponse,
				'401': { $ref: '#/components/responses/UnauthorizedError' },
			},
		},
	},

	'/api/queue/items': {
		post: {
			...common,
			summary: 'Add a track to the end of the queue',
			description: 'Appends after the last item; the current item does not change.',
			operationId: 'addQueueItem',
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/AddQueueItemRequest' },
						example: {
							trackUri: 'https://soundcloud.com/artist/track',
							title: 'Amazing Song',
							artist: 'Cool Artist',
							durationMs: 240000,
						},
					},
				},
			},
			responses: {
				'200': stateResponse,
				'400': { $ref: '#/components/responses/ValidationError' },
				'401': { $ref: '#/components/responses/UnauthorizedError' },
			},
		},
	},

	'/api/queue/items/{itemId}': {
		delete: {
			...common,
			summary: 'Remove an item from the queue',
			description:
				'Removing the current item acts as a skip: the next item becomes current; with no next item the queue is emptied, history included. Removing an item of a block detaches the whole block.',
			operationId: 'removeQueueItem',
			parameters: [itemIdParam],
			responses: {
				'200': stateResponse,
				'400': { $ref: '#/components/responses/ValidationError' },
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'404': itemNotFound,
			},
		},
	},

	'/api/queue/items/{itemId}/move': {
		post: {
			...common,
			summary: 'Move an upcoming item',
			description:
				'Places the item right after `afterItemId` (`null`: right after the current item, or at the top when nothing is current). Moving an item of a block detaches the whole block.',
			operationId: 'moveQueueItem',
			parameters: [itemIdParam],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/MoveQueueItemRequest' },
						example: { afterItemId: null },
					},
				},
			},
			responses: {
				'200': stateResponse,
				'400': { $ref: '#/components/responses/ValidationError' },
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'404': itemNotFound,
				'409': errorResponse(
					'The item or `afterItemId` is the current item or in the history (`QUEUE_ITEM_NOT_UPCOMING`)',
					'QUEUE_ITEM_NOT_UPCOMING',
					'Only upcoming items can be moved, after an upcoming item'
				),
			},
		},
	},

	'/api/queue/items/{itemId}/play': {
		post: {
			...common,
			summary: 'Play an item of the queue',
			description:
				'Makes the item current; the items before it become history. History beyond the 50 most recent items is dropped.',
			operationId: 'playQueueItem',
			parameters: [itemIdParam],
			responses: {
				'200': stateResponse,
				'400': { $ref: '#/components/responses/ValidationError' },
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'404': itemNotFound,
			},
		},
	},

	'/api/queue/next': {
		post: {
			...common,
			summary: 'Step to the next item',
			description:
				'The item after the current one becomes current (the first item when nothing is current). History beyond the 50 most recent items is dropped.',
			operationId: 'queueNext',
			responses: {
				'200': stateResponse,
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'409': errorResponse(
					'No next item (`QUEUE_END`)',
					'QUEUE_END',
					'No next item in the queue'
				),
			},
		},
	},

	'/api/queue/previous': {
		post: {
			...common,
			summary: 'Step to the previous item',
			description: 'The item before the current one becomes current.',
			operationId: 'queuePrevious',
			responses: {
				'200': stateResponse,
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'409': errorResponse(
					'No previous item, or nothing is current (`QUEUE_START`)',
					'QUEUE_START',
					'No previous item in the queue'
				),
			},
		},
	},
};

export const queueSchemas: OpenAPIV3.ComponentsObject['schemas'] = {
	QueueTrack: {
		type: 'object',
		required: ['trackUri', 'title', 'artist', 'album', 'albumArt', 'durationMs'],
		properties: {
			trackUri: {
				type: 'string',
				description: 'SoundCloud permalink URL (never a stream URL)',
				example: 'https://soundcloud.com/artist/track',
			},
			title: { type: 'string' },
			artist: { type: 'string' },
			album: { type: 'string', nullable: true },
			albumArt: { type: 'string', format: 'uri', nullable: true },
			durationMs: { type: 'integer' },
		},
	},
	QueueItem: {
		type: 'object',
		required: ['id', 'rank', 'track', 'sourcePlaylistId', 'blockId', 'blockDetached'],
		properties: {
			id: { type: 'string', format: 'uuid' },
			rank: { type: 'string', description: 'Sort key (base-62 fraction); items come sorted by it' },
			track: { $ref: '#/components/schemas/QueueTrack' },
			sourcePlaylistId: { type: 'string', format: 'uuid', nullable: true },
			blockId: {
				type: 'string',
				format: 'uuid',
				nullable: true,
				description: 'Items queued together from one playlist share a block',
			},
			blockDetached: {
				type: 'boolean',
				description: 'True once you removed or moved an item of the block',
			},
		},
	},
	QueueState: {
		type: 'object',
		required: ['currentItemId', 'items'],
		description:
			'Items in rank order. Items before the current one are history, those after it upcoming; with `currentItemId` null every item is upcoming. Also the payload of the `queue:updated` socket event.',
		properties: {
			currentItemId: { type: 'string', format: 'uuid', nullable: true },
			items: { type: 'array', items: { $ref: '#/components/schemas/QueueItem' } },
		},
	},
	AddQueueItemRequest: {
		type: 'object',
		required: ['trackUri', 'title', 'artist', 'durationMs'],
		description: 'A sent `previewUrl` is ignored: the queue never stores a stream URL.',
		properties: {
			trackUri: {
				type: 'string',
				minLength: 1,
				maxLength: 500,
				description: 'SoundCloud permalink URL',
			},
			title: { type: 'string', minLength: 1, maxLength: 200 },
			artist: { type: 'string', minLength: 1, maxLength: 200 },
			album: { type: 'string', maxLength: 200 },
			albumArt: { type: 'string', format: 'uri' },
			durationMs: { type: 'integer', minimum: 1 },
		},
	},
	MoveQueueItemRequest: {
		type: 'object',
		required: ['afterItemId'],
		properties: {
			afterItemId: {
				type: 'string',
				format: 'uuid',
				nullable: true,
				description: 'Upcoming item to place after; null = right after the current item',
			},
		},
	},
};
