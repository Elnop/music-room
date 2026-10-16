import { OpenAPIV3 } from 'openapi-types';

// Play queue (#273, #277): one queue per user, synced across their devices.
// Every endpoint answers the full QueueState and sends it as `queue:updated`
// to the owner's sockets (room `user:<id>`) and to the sockets listening to
// them (room `listening:<id>`). Under /api/users/{userId}/queue a friend who
// controls one of the owner's devices manages the owner's queue (#294); a
// playback action with a `deviceId` also sends `control:command play-item` to
// that device of the owner.

const itemIdParam: OpenAPIV3.ParameterObject = {
	in: 'path',
	name: 'itemId',
	required: true,
	schema: { type: 'string', format: 'uuid' },
	description: 'Id of an item of your queue',
};

const ownerIdParam: OpenAPIV3.ParameterObject = {
	in: 'path',
	name: 'userId',
	required: true,
	schema: { type: 'string', format: 'uuid' },
	description: 'Id of the queue owner; you must control at least one of their devices',
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

const accessDenied = errorResponse(
	'You do not control any device of the owner, or not the chosen `deviceId` (`QUEUE_ACCESS_DENIED`)',
	'QUEUE_ACCESS_DENIED',
	"Not authorized to manage this user's queue"
);

const playbackBody: OpenAPIV3.RequestBodyObject = {
	required: false,
	content: {
		'application/json': {
			schema: { $ref: '#/components/schemas/QueuePlaybackRequest' },
			example: { deviceId: 'living-room-tv' },
		},
	},
};

/** Optional body and device errors of the four playback routes (the 400 and 403 only apply to a delegate). */
const playback = {
	requestBody: playbackBody,
	errors: {
		'400': errorResponse(
			'Invalid input, or `deviceId` missing from a delegate (`DEVICE_ID_REQUIRED`)',
			'DEVICE_ID_REQUIRED',
			'A delegate must name the device to play on'
		),
		'409': errorResponse(
			'The chosen device is not connected (`DEVICE_OFFLINE`); the queue is unchanged',
			'DEVICE_OFFLINE',
			'Target device is not online'
		),
	},
};

/** A playback route's own 409 response, extended with the device-offline one. */
function withDevice(status: '409', own: OpenAPIV3.ResponseObject): OpenAPIV3.ResponseObject {
	const device = playback.errors[status];
	return { ...own, description: `${own.description}; ${device.description}` };
}

const common = {
	tags: ['Queue'],
	security: [{ bearerAuth: [] }],
};

const ownPaths: OpenAPIV3.PathsObject = {
	'/api/queue': {
		get: {
			...common,
			summary: 'Get your play queue',
			description:
				'Returns `{ ownerId, version: 0, currentItemId: null, items: [] }` when you never queued anything.',
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
			summary: 'Add a track to the queue',
			description:
				'Appends after the last item; the current item does not change. With `next: true`, the item is placed right after the current item instead (at the top when nothing is current), in one call that publishes one state.',
			operationId: 'addQueueItem',
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/AddQueueItemBody' },
						example: {
							trackUri: 'https://soundcloud.com/artist/track',
							title: 'Amazing Song',
							artist: 'Cool Artist',
							durationMs: 240000,
							next: true,
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
				'Makes the item current; the items before it become history. History beyond the 50 most recent items is dropped. With `deviceId`, that device of the owner is told to play the item. A delegate must send `deviceId`: a device they control and that is online.',
			operationId: 'playQueueItem',
			parameters: [itemIdParam],
			requestBody: playback.requestBody,
			responses: {
				'200': stateResponse,
				'400': { $ref: '#/components/responses/ValidationError' },
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'404': itemNotFound,
				'409': playback.errors['409'],
			},
		},
	},

	'/api/queue/playlists/{playlistId}/play': {
		post: {
			...common,
			summary: 'Play a playlist through the queue',
			description:
				"Copies the playlist's tracks, in playlist order, into your queue as a new block (one new `blockId`, `sourcePlaylistId` = the playlist) placed right after the current item, or at the top when nothing is current, and makes the block's first item current. The item that was playing becomes history; the upcoming items follow the block. Playing the same playlist again adds a second, separate block. History beyond the 50 most recent items is dropped.",
			operationId: 'queuePlayPlaylist',
			parameters: [
				{
					in: 'path',
					name: 'playlistId',
					required: true,
					schema: { type: 'string', format: 'uuid' },
					description: 'Id of a playlist you can view',
				},
			],
			requestBody: playback.requestBody,
			responses: {
				'200': stateResponse,
				'400': { $ref: '#/components/responses/ValidationError' },
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'403': errorResponse(
					'You cannot view the playlist (`PLAYLIST_ACCESS_DENIED`)',
					'PLAYLIST_ACCESS_DENIED',
					'Access denied'
				),
				'404': errorResponse(
					'No playlist has this id (`PLAYLIST_NOT_FOUND`)',
					'PLAYLIST_NOT_FOUND',
					'Playlist not found'
				),
				'409': withDevice(
					'409',
					errorResponse(
						'The playlist has no track (`PLAYLIST_EMPTY`); the queue is unchanged',
						'PLAYLIST_EMPTY',
						'The playlist has no track to play'
					)
				),
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
			requestBody: playback.requestBody,
			responses: {
				'200': stateResponse,
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'400': { $ref: '#/components/responses/ValidationError' },
				'409': withDevice(
					'409',
					errorResponse('No next item (`QUEUE_END`)', 'QUEUE_END', 'No next item in the queue')
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
			requestBody: playback.requestBody,
			responses: {
				'200': stateResponse,
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'400': { $ref: '#/components/responses/ValidationError' },
				'409': withDevice(
					'409',
					errorResponse(
						'No previous item, or nothing is current (`QUEUE_START`)',
						'QUEUE_START',
						'No previous item in the queue'
					)
				),
			},
		},
	},
};

const METHODS = ['get', 'post', 'delete'] as const;

/** The same operations under /api/users/{userId}/queue, for a delegate (#294). */
function delegatedPaths(paths: OpenAPIV3.PathsObject): OpenAPIV3.PathsObject {
	const mirrored: OpenAPIV3.PathsObject = {};
	for (const [path, item] of Object.entries(paths)) {
		const mirror: OpenAPIV3.PathItemObject = {};
		for (const method of METHODS) {
			const operation = item?.[method];
			if (!operation) continue;
			const isPlayback = operation.requestBody === playback.requestBody;
			const own403 = operation.responses['403'] as OpenAPIV3.ResponseObject | undefined;
			mirror[method] = {
				...operation,
				summary: `${operation.summary} (queue of a friend you control)`,
				operationId: `${operation.operationId}ForUser`,
				parameters: [ownerIdParam, ...(operation.parameters ?? [])],
				responses: {
					...operation.responses,
					// A delegate must name the device (400) and may lack access (403).
					...(isPlayback && { '400': playback.errors['400'] }),
					'403': own403
						? { ...own403, description: `${own403.description}; ${accessDenied.description}` }
						: accessDenied,
				},
			};
		}
		mirrored[path.replace('/api/queue', '/api/users/{userId}/queue')] = mirror;
	}
	return mirrored;
}

// Not part of ownPaths: a transfer always starts from the caller, so it has no /api/users/{userId} mirror.
const transferPath: OpenAPIV3.PathsObject = {
	'/api/queue/transfer': {
		post: {
			...common,
			summary: "Transfer playback to one of your devices or a friend's",
			description:
				"Checked in this order, before anything changes: the target device (you own it, or have its license; it must be online), the `source` device (you must control it; offline is fine), and `playing.queueItemId` (must be in your own queue). **Target is one of your devices**: your queue is unchanged and the device gets `control:command` `play-item` (item of your queue) or `play-track` (`playing.track`, played outside the queue) at `positionMs`; `queue` is null. **Target is a friend's device**: the played track and the items that follow it in your queue (or `playing.track` then your upcoming items) are inserted as one block right after the friend's current item and the block's first item becomes current; the friend's sockets get `queue:updated`, the device gets `play-item`, and `queue` is the friend's new queue. If `source` is given, it then gets `control:command` `pause`.",
			operationId: 'queueTransfer',
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/TransferRequest' },
						example: {
							targetUserId: '3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e',
							targetDeviceId: 'living-room-tv',
							positionMs: 42000,
							playing: { queueItemId: '7a1d9e2c-5b3f-4c8a-9d6e-1f2a3b4c5d6e' },
							source: { userId: '9c8b7a6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d', deviceId: 'phone' },
						},
					},
				},
			},
			responses: {
				'200': {
					description: 'Playback was ordered on the target device',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: { data: { $ref: '#/components/schemas/TransferResult' } },
									},
								],
							},
						},
					},
				},
				'400': { $ref: '#/components/responses/ValidationError' },
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'403': errorResponse(
					'You do not control the target device or the `source` device (`QUEUE_ACCESS_DENIED`)',
					'QUEUE_ACCESS_DENIED',
					"Not authorized to manage this user's queue"
				),
				'404': itemNotFound,
				'409': errorResponse(
					'The target device is not connected (`DEVICE_OFFLINE`), or there is nothing to transfer (`QUEUE_BLOCK_EMPTY`); no queue changed',
					'DEVICE_OFFLINE',
					'Target device is not online'
				),
			},
		},
	},
};

export const queuePaths: OpenAPIV3.PathsObject = {
	...ownPaths,
	...delegatedPaths(ownPaths),
	...transferPath,
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
		required: ['ownerId', 'version', 'currentItemId', 'items'],
		description:
			'Items in rank order. Items before the current one are history, those after it upcoming; with `currentItemId` null every item is upcoming. `version` grows with every change: a client drops a state whose version is not above the one it holds. Also the payload of the `queue:updated` socket event.',
		properties: {
			ownerId: { type: 'string', format: 'uuid' },
			version: { type: 'integer', minimum: 0, example: 12 },
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
	AddQueueItemBody: {
		allOf: [
			{ $ref: '#/components/schemas/AddQueueItemRequest' },
			{
				type: 'object',
				properties: {
					next: {
						type: 'boolean',
						description:
							'True: place the item right after the current item (at the top when nothing is current) instead of at the end',
					},
				},
			},
		],
	},
	QueuePlaybackRequest: {
		type: 'object',
		properties: {
			deviceId: {
				type: 'string',
				minLength: 1,
				maxLength: 128,
				description:
					'Device of the owner that must play; required from a delegate, optional for the owner (omitted: the calling device plays)',
			},
		},
	},
	TransferRequest: {
		type: 'object',
		required: ['targetUserId', 'targetDeviceId', 'positionMs', 'playing'],
		properties: {
			targetUserId: {
				type: 'string',
				format: 'uuid',
				description: 'Owner of the target device: you or a friend',
			},
			targetDeviceId: { type: 'string', minLength: 1, maxLength: 128 },
			positionMs: { type: 'integer', minimum: 0, maximum: 86400000 },
			playing: {
				type: 'object',
				description: 'Exactly one of `queueItemId` (an item of your queue) or `track`',
				properties: {
					queueItemId: { type: 'string', format: 'uuid' },
					track: { $ref: '#/components/schemas/AddQueueItemRequest' },
				},
			},
			source: {
				type: 'object',
				description:
					'The remote device that plays now, which is paused; leave out when playing on this device',
				required: ['userId', 'deviceId'],
				properties: {
					userId: { type: 'string', format: 'uuid' },
					deviceId: { type: 'string', minLength: 1, maxLength: 128 },
				},
			},
		},
	},
	TransferResult: {
		type: 'object',
		required: ['ownerId', 'deviceId', 'queue'],
		properties: {
			ownerId: { type: 'string', format: 'uuid' },
			deviceId: { type: 'string' },
			queue: {
				allOf: [{ $ref: '#/components/schemas/QueueState' }],
				nullable: true,
				description: "The friend's new queue; null when the target is one of your devices",
			},
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
