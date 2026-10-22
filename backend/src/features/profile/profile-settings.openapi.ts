import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
	genresSchema,
	musicPreferencesSchema,
	privacySettingsSchema,
} from '@/features/profile/profile-responses.validators.js';
import {
	updateMusicPreferencesSchema,
	updatePrivacySchema,
} from '@/features/profile/profile.validators.js';
import { bearerAuth, jsonBody, nameSchemas, ok } from '@/shared/config/swagger.schemas.js';
import { shared } from '@/shared/config/swagger.errors.js';

/** Registers the privacy and music preference routes of /api/profile. */
export function registerProfileSettingsOpenapi(registry: OpenAPIRegistry): void {
	const common = { tags: ['Profile'], security: bearerAuth };
	const unauthorized = shared('UnauthorizedError');
	const validation = shared('ValidationError');
	const privacyBody = updatePrivacySchema.meta({
		description: 'Fields to change; omitted fields keep their value, unknown fields are ignored',
	});
	nameSchemas({
		PrivacySettings: privacySettingsSchema,
		MusicPreferences: musicPreferencesSchema,
		UpdatePrivacySettingsRequest: privacyBody,
		UpdateMusicPreferencesRequest: updateMusicPreferencesSchema,
	});

	registry.registerPath({
		...common,
		method: 'get',
		path: '/api/profile/privacy',
		summary: "Get current user's privacy settings",
		operationId: 'getPrivacySettings',
		responses: { 200: ok('Privacy settings retrieved', privacySettingsSchema), 401: unauthorized },
	});

	registry.registerPath({
		...common,
		method: 'put',
		path: '/api/profile/privacy',
		summary: "Update current user's privacy settings",
		operationId: 'updatePrivacySettings',
		request: {
			body: jsonBody(privacyBody, { bioVisibility: 'friends_only', emailVisibility: 'private' }),
		},
		responses: {
			200: ok('Privacy settings updated', privacySettingsSchema),
			400: validation,
			401: unauthorized,
		},
	});

	registry.registerPath({
		...common,
		method: 'get',
		path: '/api/profile/music-preferences',
		summary: "Get current user's music preferences",
		operationId: 'getMusicPreferences',
		responses: {
			200: ok('Music preferences retrieved', musicPreferencesSchema),
			401: unauthorized,
		},
	});

	registry.registerPath({
		...common,
		method: 'put',
		path: '/api/profile/music-preferences',
		summary: "Update current user's music preferences",
		description: 'Set favorite genres (maximum 5)',
		operationId: 'updateMusicPreferences',
		request: { body: jsonBody(updateMusicPreferencesSchema, { genres: ['electronic', 'jazz'] }) },
		responses: {
			200: ok('Music preferences updated', musicPreferencesSchema),
			400: validation,
			401: unauthorized,
		},
	});

	registry.registerPath({
		...common,
		method: 'get',
		path: '/api/profile/music-preferences/genres',
		summary: 'Get all available music genres',
		operationId: 'getAvailableGenres',
		responses: {
			200: ok('List of genres', genresSchema),
			401: unauthorized,
		},
	});
}
