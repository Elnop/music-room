import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { coverResponseSchema } from '@/features/playlists/playlist-responses.validators.js';
import { playlistIdParamSchema } from '@/features/playlists/playlist.validators.js';
import { bearerAuth, nameSchemas, ok } from '@/shared/config/swagger.schemas.js';
import { fail, shared } from '@/shared/config/swagger.errors.js';

export function registerPlaylistCoverOpenapi(registry: OpenAPIRegistry): void {
	const common = { tags: ['Playlists'], security: bearerAuth };
	const limited = { 429: shared('RateLimitError'), 503: shared('RateLimitUnavailable') };
	const notOwner = ['PLAYLIST_ACCESS_DENIED', 'Access denied'] as [string, string];
	nameSchemas({ PlaylistCover: coverResponseSchema });

	registry.registerPath({
		...common,
		method: 'put',
		path: '/api/playlists/{id}/cover',
		summary: 'Upload a custom playlist cover (Premium)',
		description:
			"Owner only, on the Premium plan. Multipart upload of the image in the `cover` field: JPEG, PNG or WebP, at most 2 MB, type read from the file's bytes. The file is stored in the public `playlist-covers` bucket and becomes `coverUrl`; the previous cover file is deleted. The playlist's room receives `playlist:details` with the new `coverUrl`. Rate-limited per user (10 changes per hour by default, shared with DELETE).",
		operationId: 'uploadPlaylistCover',
		request: {
			params: playlistIdParamSchema,
			body: {
				required: true,
				content: {
					'multipart/form-data': {
						schema: z.object({
							cover: z.string().meta({
								format: 'binary',
								description: 'JPEG, PNG or WebP image, at most 2 MB',
							}),
						}),
					},
				},
			},
		},
		responses: {
			200: ok('Cover stored; `coverUrl` is its public URL', coverResponseSchema),
			400: fail(
				'INVALID_IMAGE: not a JPEG, PNG or WebP file. VALIDATION_ERROR: no `cover` file. INVALID_UPLOAD: malformed multipart body',
				['INVALID_IMAGE', 'The file is not a JPEG, PNG or WebP image']
			),
			401: shared('UnauthorizedError'),
			403: fail(
				'PLAYLIST_ACCESS_DENIED: not the owner. PREMIUM_REQUIRED: the owner is on the free plan',
				notOwner,
				['PREMIUM_REQUIRED', 'This feature requires the Premium plan']
			),
			404: shared('NotFoundError'),
			413: fail('FILE_TOO_LARGE: the image is over 2 MB; nothing is stored', [
				'FILE_TOO_LARGE',
				'The cover must not exceed 2 MB',
			]),
			...limited,
		},
	});

	registry.registerPath({
		...common,
		method: 'delete',
		path: '/api/playlists/{id}/cover',
		summary: 'Remove the custom playlist cover',
		description:
			"Owner only, on any plan: a cover kept after going back to free can still be removed. Sets `coverUrl` to null (the app shows the first track's artwork), deletes the file and sends `playlist:details` to the room.",
		operationId: 'removePlaylistCover',
		request: { params: playlistIdParamSchema },
		responses: {
			200: ok('Cover removed', coverResponseSchema),
			401: shared('UnauthorizedError'),
			403: fail('PLAYLIST_ACCESS_DENIED: not the owner', notOwner),
			404: shared('NotFoundError'),
			...limited,
		},
	});
}
