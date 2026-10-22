import type { ResponseConfig, RouteConfig } from '@asteasolutions/zod-to-openapi';
import {
	queueItemParamsSchema,
	queuePlaybackSchema,
	queuePlaylistParamsSchema,
	queueStateSchema,
} from '@/features/queue/queue.validators.js';
import { bearerAuth, jsonBody, ok } from '@/shared/config/swagger.schemas.js';
import { fail, shared } from '@/shared/config/swagger.errors.js';

export const itemNotFound = fail(
	"The item is not in your queue (`QUEUE_ITEM_NOT_FOUND`); another user's item answers the same",
	['QUEUE_ITEM_NOT_FOUND', 'Queue item not found']
);

const deviceOffline = fail(
	'The chosen device is not connected (`DEVICE_OFFLINE`); the queue is unchanged',
	['DEVICE_OFFLINE', 'Target device is not online']
);

/** A playback route's own 409, extended with the device-offline one. */
const orOffline = (own: ResponseConfig): ResponseConfig => ({
	...own,
	description: `${own.description}; ${deviceOffline.description}`,
});

export const base = {
	method: 'post' as const,
	tags: ['Queue'],
	security: bearerAuth,
};

/** Optional body of the four playback routes: the owner's device that must play. */
const playbackBody = jsonBody(queuePlaybackSchema, { deviceId: 'living-room-tv' }, false);

/** Responses of every route: the full queue after the operation. */
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
	responses: { ...answers, 404: itemNotFound, 409: deviceOffline },
};

const playPlaylist: RouteConfig = {
	...base,
	path: '/api/queue/playlists/{playlistId}/play',
	summary: 'Play a playlist through the queue',
	description:
		"Copies the playlist's tracks, in playlist order, into your queue as a new block (one new `blockId`, `sourcePlaylistId` = the playlist) placed right after the current item, or at the top when nothing is current, and makes the block's first item current. The item that was playing becomes history; the upcoming items follow the block. Playing the same playlist again adds a second, separate block. History beyond the 50 most recent items is dropped.",
	operationId: 'queuePlayPlaylist',
	request: { params: queuePlaylistParamsSchema, body: playbackBody },
	responses: {
		...answers,
		403: fail('You cannot view the playlist (`PLAYLIST_ACCESS_DENIED`)', [
			'PLAYLIST_ACCESS_DENIED',
			'Access denied',
		]),
		404: fail('No playlist has this id (`PLAYLIST_NOT_FOUND`)', [
			'PLAYLIST_NOT_FOUND',
			'Playlist not found',
		]),
		409: orOffline(
			fail('The playlist has no track (`PLAYLIST_EMPTY`); the queue is unchanged', [
				'PLAYLIST_EMPTY',
				'The playlist has no track to play',
			])
		),
	},
};

const next: RouteConfig = {
	...base,
	path: '/api/queue/next',
	summary: 'Step to the next item',
	description:
		'The item after the current one becomes current (the first item when nothing is current). History beyond the 50 most recent items is dropped.',
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
	description: 'The item before the current one becomes current.',
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

/** The routes whose body names the device that plays: a delegate must send it. */
export const playbackRoutes = [playItem, playPlaylist, next, previous];
