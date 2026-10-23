import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { registerProfileAvatarOpenapi } from '@/features/profile/profile-avatar.openapi.js';
import { registerProfileSettingsOpenapi } from '@/features/profile/profile-settings.openapi.js';
import {
	filteredProfileSchema,
	ownProfileSchema,
	publicProfileSchema,
} from '@/features/profile/profile-responses.validators.js';
import { searchUsersSchema, updateProfileSchema } from '@/features/profile/profile.validators.js';
import {
	bearerAuth,
	describeParams,
	jsonBody,
	nameSchemas,
	ok,
	param,
} from '@/shared/config/swagger.schemas.js';
import { shared } from '@/shared/config/swagger.errors.js';

export function registerProfileOpenapi(registry: OpenAPIRegistry): void {
	const common = { tags: ['Profile'], security: bearerAuth };
	const unauthorized = shared('UnauthorizedError');
	const validation = shared('ValidationError');
	nameSchemas({
		OwnProfile: ownProfileSchema,
		SearchProfile: publicProfileSchema,
		FilteredProfile: filteredProfileSchema,
		UpdateProfileRequest: updateProfileSchema,
	});

	registry.registerPath({
		...common,
		method: 'get',
		path: '/api/profile',
		summary: "Get current user's profile",
		operationId: 'getOwnProfile',
		responses: { 200: ok('Profile retrieved', ownProfileSchema), 401: unauthorized },
	});

	registry.registerPath({
		...common,
		method: 'patch',
		path: '/api/profile',
		summary: "Update current user's profile",
		operationId: 'updateProfile',
		request: { body: jsonBody(updateProfileSchema) },
		responses: { 200: ok('Profile updated', ownProfileSchema), 400: validation, 401: unauthorized },
	});

	registry.registerPath({
		...common,
		method: 'get',
		path: '/api/profile/search',
		summary: 'Search users by username or display name',
		description:
			"Excludes the requester. Each result's avatarUrl and bio follow that profile's privacy settings for the requester (absent when hidden), as on GET /api/profile/{userId}.",
		operationId: 'searchUsers',
		request: {
			query: describeParams(searchUsersSchema, {
				q: 'Search query',
				limit: 'Maximum number of results',
			}),
		},
		responses: {
			200: ok('Search results', z.array(publicProfileSchema)),
			400: validation,
			401: unauthorized,
		},
	});

	registry.registerPath({
		...common,
		method: 'get',
		path: '/api/profile/{userId}',
		summary: 'Get user profile by ID',
		description:
			'Returns user profile filtered by privacy settings. Only visible fields are returned.',
		operationId: 'getProfileById',
		request: { params: z.object({ userId: param(z.uuid(), 'User ID') }) },
		responses: {
			200: ok('User profile retrieved', filteredProfileSchema),
			401: unauthorized,
			404: shared('NotFoundError'),
		},
	});

	registerProfileAvatarOpenapi(registry);
	registerProfileSettingsOpenapi(registry);
}
