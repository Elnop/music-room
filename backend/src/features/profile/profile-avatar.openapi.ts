import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { avatarResponseSchema } from '@/features/profile/profile-responses.validators.js';
import { bearerAuth, ok } from '@/shared/config/swagger.schemas.js';
import { fail, shared } from '@/shared/config/swagger.errors.js';

export function registerProfileAvatarOpenapi(registry: OpenAPIRegistry): void {
	const common = { tags: ['Profile'], security: bearerAuth };
	const unauthorized = shared('UnauthorizedError');
	const limited = { 429: shared('RateLimitError'), 503: shared('RateLimitUnavailable') };

	registry.registerPath({
		...common,
		method: 'put',
		path: '/api/profile/avatar',
		summary: 'Upload a new profile photo',
		description:
			"Multipart upload of the photo in the `avatar` field: JPEG, PNG or WebP, at most 2 MB. The type is read from the file's bytes; the declared MIME type is ignored. The file is stored in the public `avatars` Storage bucket under a random name and becomes `avatarUrl`; the previous photo is deleted when it was stored there (a Google or Facebook picture is left alone). Who sees the URL still depends on `avatar_visibility`. Rate-limited per user (10 changes per hour by default, shared with DELETE).",
		operationId: 'uploadAvatar',
		request: {
			body: {
				required: true,
				content: {
					'multipart/form-data': {
						schema: z.object({
							avatar: z.string().meta({
								format: 'binary',
								description: 'JPEG, PNG or WebP image, at most 2 MB',
							}),
						}),
					},
				},
			},
		},
		responses: {
			200: ok('Photo stored; `avatarUrl` is its public URL', avatarResponseSchema),
			400: fail(
				'INVALID_IMAGE: not a JPEG, PNG or WebP file. VALIDATION_ERROR: no `avatar` file. INVALID_UPLOAD: malformed multipart body',
				['INVALID_IMAGE', 'The file is not a JPEG, PNG or WebP image']
			),
			401: unauthorized,
			413: fail('FILE_TOO_LARGE: the photo is over 2 MB; nothing is stored', [
				'FILE_TOO_LARGE',
				'The photo must not exceed 2 MB',
			]),
			...limited,
		},
	});

	registry.registerPath({
		...common,
		method: 'delete',
		path: '/api/profile/avatar',
		summary: 'Remove the profile photo',
		description:
			'Sets `avatarUrl` to null (the app shows initials) and deletes the photo when it was stored in the `avatars` bucket. Rate-limited per user, shared with PUT.',
		operationId: 'removeAvatar',
		responses: { 200: ok('Photo removed', avatarResponseSchema), 401: unauthorized, ...limited },
	});
}
