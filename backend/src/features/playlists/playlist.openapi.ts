import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { registerPlaylistCoverOpenapi } from '@/features/playlists/playlist-cover.openapi.js';
import { registerPlaylistSharingOpenapi } from '@/features/playlists/playlist-sharing.openapi.js';
import { registerPlaylistTracksOpenapi } from '@/features/playlists/playlist-tracks.openapi.js';
import {
	playlistBodySchema,
	playlistDetailSchema,
	playlistListSchema,
	playlistSchema,
	playlistWithTracksSchema,
} from '@/features/playlists/playlist-responses.validators.js';
import {
	createPlaylistSchema,
	playlistIdParamSchema,
	updatePlaylistSchema,
} from '@/features/playlists/playlist.validators.js';
import { z } from 'zod';
import {
	bearerAuth,
	jsonBody,
	nameSchemas,
	ok,
	okMessage,
	param,
} from '@/shared/config/swagger.schemas.js';
import { fail, shared } from '@/shared/config/swagger.errors.js';

/** Registers the /api/playlists routes. */
export function registerPlaylistOpenapi(registry: OpenAPIRegistry): void {
	const common = { tags: ['Playlists'], security: bearerAuth };
	nameSchemas({
		PlaylistResponse: playlistSchema,
		PlaylistDetail: playlistWithTracksSchema,
		CreatePlaylistRequest: createPlaylistSchema,
		UpdatePlaylistRequest: updatePlaylistSchema,
	});
	const unauthorized = shared('UnauthorizedError');
	const ownerOnly = {
		401: unauthorized,
		403: shared('ForbiddenError'),
		404: shared('NotFoundError'),
	};

	registry.registerPath({
		...common,
		method: 'get',
		path: '/api/playlists',
		summary: "Get user's playlists",
		description:
			'Returns playlists owned by or shared with the authenticated user (collaborator or viewer)',
		operationId: 'getUserPlaylists',
		responses: { 200: ok('List of playlists retrieved', playlistListSchema), 401: unauthorized },
	});

	registry.registerPath({
		...common,
		method: 'post',
		path: '/api/playlists',
		summary: 'Create new playlist',
		operationId: 'createPlaylist',
		request: { body: jsonBody(createPlaylistSchema) },
		responses: {
			201: ok('Playlist created successfully', playlistBodySchema),
			400: shared('ValidationError'),
			401: unauthorized,
		},
	});

	registry.registerPath({
		...common,
		method: 'get',
		path: '/api/playlists/public',
		summary: 'Get public playlists',
		description:
			"Returns up to 50 public playlists not owned by the authenticated user, newest first, each with its owner's profile and track count",
		operationId: 'getPublicPlaylists',
		responses: {
			200: ok('Public playlists retrieved', playlistListSchema),
			401: unauthorized,
			500: fail('PLAYLIST_FETCH_ERROR: the public playlists could not be read', [
				'PLAYLIST_FETCH_ERROR',
				'Failed to fetch public playlists',
			]),
		},
	});

	registry.registerPath({
		...common,
		method: 'get',
		path: '/api/playlists/user/{userId}',
		summary: "Get another user's visible playlists",
		description:
			'Returns public playlists and private playlists where authenticated user is invited',
		operationId: 'getPlaylistsByUser',
		request: {
			params: z.object({ userId: param(z.uuid(), 'User ID whose playlists to retrieve') }),
		},
		responses: { 200: ok('Playlists retrieved', playlistListSchema), 401: unauthorized },
	});

	registry.registerPath({
		...common,
		method: 'get',
		path: '/api/playlists/{id}',
		summary: 'Get playlist by ID with tracks',
		description: 'Returns playlist details including all tracks, ordered by rank',
		operationId: 'getPlaylistById',
		request: { params: playlistIdParamSchema },
		responses: { 200: ok('Playlist retrieved', playlistDetailSchema), ...ownerOnly },
	});

	registry.registerPath({
		...common,
		method: 'patch',
		path: '/api/playlists/{id}',
		summary: 'Update playlist metadata',
		description: 'Update name, description, visibility, or edit mode. Owner only.',
		operationId: 'updatePlaylist',
		request: { params: playlistIdParamSchema, body: jsonBody(updatePlaylistSchema) },
		responses: {
			200: ok('Playlist updated', playlistBodySchema),
			400: shared('ValidationError'),
			...ownerOnly,
		},
	});

	registry.registerPath({
		...common,
		method: 'delete',
		path: '/api/playlists/{id}',
		summary: 'Delete playlist',
		description: 'Permanently delete playlist. Owner only.',
		operationId: 'deletePlaylist',
		request: { params: playlistIdParamSchema },
		responses: {
			200: okMessage('Playlist deleted', 'Playlist deleted successfully'),
			...ownerOnly,
		},
	});

	registerPlaylistTracksOpenapi(registry);
	registerPlaylistSharingOpenapi(registry);
	registerPlaylistCoverOpenapi(registry);
}
