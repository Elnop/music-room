import type { ResponseConfig, RouteConfig } from '@asteasolutions/zod-to-openapi';
import {
	queueItemParamsSchema,
	queuePlaybackSchema,
	queuePlayPlaylistSchema,
	queuePlaylistParamsSchema,
	queueStateSchema,
} from '@/features/queue/queue.validators.js';
import { bearerAuth, jsonBody, ok } from '@/shared/config/swagger.schemas.js';
import { fail, shared } from '@/shared/config/swagger.errors.js';

export const itemNotFound = fail(
	"The item is not in your queue (`QUEUE_ITEM_NOT_FOUND`); another user's item answers the same",
	['QUEUE_ITEM_NOT_FOUND', 'Queue item not found']
);

export const trackUnavailable = fail(
	'The track is deleted, private or blocked on SoundCloud (`TRACK_UNAVAILABLE`); the queue is unchanged',
	['TRACK_UNAVAILABLE', 'This track is no longer available on SoundCloud']
);

const deviceOffline = fail(
	'The chosen device is not connected (`DEVICE_OFFLINE`); the queue is unchanged',
	['DEVICE_OFFLINE', 'Target device is not online']
);

const orOffline = (own: ResponseConfig): ResponseConfig => ({
	...own,
	description: `${own.description}; ${deviceOffline.description}`,
});

export const base = {
	method: 'post' as const,
	tags: ['Queue'],
	security: bearerAuth,
};

/** The owner's device that must play. */
const playbackBody = jsonBody(queuePlaybackSchema, { deviceId: 'living-room-tv' }, false);

export const answers = {
	200: ok('The full queue after the operation', queueStateSchema),
	400: shared('ValidationError'),
	401: shared('UnauthorizedError'),
};

const playItem: RouteConfig = {
	...base,
	path: '/api/queue/items/{itemId}/play',
	summary: 'Play an item of the queue',
	description:
		'Makes the item current; the items before it become history. History beyond the 50 most recent items is dropped. With `deviceId`, that device of the owner is told to play the item. A delegate must send `deviceId`: a device they control and that is online.',
	operationId: 'playQueueItem',
	request: { params: queueItemParamsSchema, body: playbackBody },
	responses: {
		...answers,
		404: itemNotFound,
		409: orOffline(trackUnavailable),
	},
};

const playPlaylist: RouteConfig = {
	...base,
	path: '/api/queue/playlists/{playlistId}/play',
	summary: 'Play a playlist through the queue',
	description:
		"Copies the playlist's available tracks (an unavailable one is skipped), in playlist order, into your queue as a new block (one new `blockId`, `sourcePlaylistId` = the playlist) placed right after the current item, or at the top when nothing is current, and makes the block's first item current, or the item of `startTrackId` (the `id` of one of the playlist's tracks): the tracks before it stay in the block as history. The item that was playing becomes history; the upcoming items follow the block. Playing the same playlist again adds a second, separate block. History beyond the 50 most recent items is dropped.",
	operationId: 'queuePlayPlaylist',
	request: {
		params: queuePlaylistParamsSchema,
		body: jsonBody(
			queuePlayPlaylistSchema,
			{ deviceId: 'living-room-tv', startTrackId: '7d3f1c2a-5b6e-4f80-9a1b-2c3d4e5f6a7b' },
			false
		),
	},
	responses: {
		...answers,
		403: fail('You cannot view the playlist (`PLAYLIST_ACCESS_DENIED`)', [
			'PLAYLIST_ACCESS_DENIED',
			'Access denied',
		]),
		404: fail(
			'No playlist has this id (`PLAYLIST_NOT_FOUND`), or `startTrackId` is not a track of it (`PLAYLIST_TRACK_NOT_FOUND`)',
			['PLAYLIST_NOT_FOUND', 'Playlist not found'],
			['PLAYLIST_TRACK_NOT_FOUND', 'Track not found in the playlist']
		),
		409: orOffline(
			fail(
				'The playlist has no available track (`PLAYLIST_EMPTY`), or `startTrackId` is unavailable (`TRACK_UNAVAILABLE`); the queue is unchanged',
				['PLAYLIST_EMPTY', 'The playlist has no track to play'],
				['TRACK_UNAVAILABLE', 'This track is no longer available on SoundCloud']
			)
		),
	},
};

const next: RouteConfig = {
	...base,
	path: '/api/queue/next',
	summary: 'Step to the next item',
	description:
		'The next item of an available track becomes current (from the top when nothing is current). History beyond the 50 most recent items is dropped.',
	operationId: 'queueNext',
	request: { body: playbackBody },
	responses: {
		...answers,
		409: orOffline(fail('No next item (`QUEUE_END`)', ['QUEUE_END', 'No next item in the queue'])),
	},
};

const previous: RouteConfig = {
	...base,
	path: '/api/queue/previous',
	summary: 'Step to the previous item',
	description: 'The previous item of an available track becomes current.',
	operationId: 'queuePrevious',
	request: { body: playbackBody },
	responses: {
		...answers,
		409: orOffline(
			fail('No previous item, or nothing is current (`QUEUE_START`)', [
				'QUEUE_START',
				'No previous item in the queue',
			])
		),
	},
};

/** A delegate must send the device that plays. */
export const playbackRoutes = [playItem, playPlaylist, next, previous];
