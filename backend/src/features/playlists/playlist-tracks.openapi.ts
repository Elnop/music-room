import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
	addTrackResultSchema,
	moveTrackResultSchema,
	playlistTrackSchema,
	removeTrackResultSchema,
} from '@/features/playlists/playlist-responses.validators.js';
import {
	addTrackSchema,
	moveTrackSchema,
	playlistIdParamSchema,
	trackIdParamSchema,
} from '@/features/playlists/playlist.validators.js';
import {
	bearerAuth,
	describeParams,
	jsonBody,
	nameSchemas,
	ok,
} from '@/shared/config/swagger.schemas.js';
import { fail, shared } from '@/shared/config/swagger.errors.js';

/** Registers the /api/playlists/{id}/tracks routes (doc/PLAYLIST_CONCURRENCY.md). */
export function registerPlaylistTracksOpenapi(registry: OpenAPIRegistry): void {
	const common = { tags: ['Tracks'], security: bearerAuth };
	const trackParams = (description: string) =>
		describeParams(playlistIdParamSchema.extend(trackIdParamSchema.shape), {
			trackId: description,
		});
	nameSchemas({
		PlaylistTrack: playlistTrackSchema,
		AddTrackResult: addTrackResultSchema,
		RemoveTrackResult: removeTrackResultSchema,
		MoveTrackResult: moveTrackResultSchema,
		AddTrackRequest: addTrackSchema,
		MoveTrackRequest: moveTrackSchema,
	});
	const denied = { 401: shared('UnauthorizedError'), 403: shared('ForbiddenError') };

	registry.registerPath({
		...common,
		method: 'post',
		path: '/api/playlists/{id}/tracks',
		summary: 'Add track to playlist',
		description:
			'Appends a track at the end of the playlist and increments tracksVersion. Never refused because of concurrency. Owner and collaborators with edit permission can add tracks. See doc/PLAYLIST_CONCURRENCY.md.',
		operationId: 'addTrack',
		request: { params: playlistIdParamSchema, body: jsonBody(addTrackSchema) },
		responses: {
			201: ok('Track added to playlist', addTrackResultSchema),
			400: shared('ValidationError'),
			...denied,
			404: shared('NotFoundError'),
			409: fail('TRACK_DUPLICATE: the track is already in the playlist', [
				'TRACK_DUPLICATE',
				'Track already in playlist',
			]),
		},
	});

	registry.registerPath({
		...common,
		method: 'delete',
		path: '/api/playlists/{id}/tracks/{trackId}',
		summary: 'Remove track from playlist',
		description:
			'Removes a track from the playlist. Owner and collaborators with edit permission can remove tracks.',
		operationId: 'removeTrack',
		request: { params: trackParams('Track ID to remove') },
		responses: {
			200: ok('Track removed from playlist', removeTrackResultSchema),
			400: shared('ValidationError'),
			...denied,
			404: fail(
				'PLAYLIST_NOT_FOUND: the playlist does not exist. TRACK_NOT_IN_PLAYLIST: the track is not (or no longer) in the playlist.',
				['TRACK_NOT_IN_PLAYLIST', 'Track is not in the playlist']
			),
		},
	});

	registry.registerPath({
		...common,
		method: 'post',
		path: '/api/playlists/{id}/tracks/{trackId}/move',
		summary: 'Move a track',
		description:
			'Places the track right after afterRank. Refused with 409 only when this same track moved or was removed since expectedVersion, or when the playlist ranks were rebalanced since then. See doc/PLAYLIST_CONCURRENCY.md.',
		operationId: 'moveTrack',
		request: {
			params: trackParams('Track ID to move'),
			body: jsonBody(moveTrackSchema, { afterRank: 'h', expectedVersion: 10 }),
		},
		responses: {
			200: ok('Track moved', moveTrackResultSchema),
			400: shared('ValidationError'),
			...denied,
			404: shared('NotFoundError'),
			409: fail(
				'TRACK_MOVED_CONCURRENTLY: the track moved since expectedVersion. TRACK_NOT_IN_PLAYLIST: it was removed. PLAYLIST_REBALANCED: every rank changed since expectedVersion. The client reloads the playlist.',
				['TRACK_MOVED_CONCURRENTLY', 'Track was moved by someone else']
			),
		},
	});
}
