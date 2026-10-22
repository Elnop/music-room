import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import swaggerUi from 'swagger-ui-express';
import { env } from '@/shared/config/env.js';
import { registerErrorComponents } from '@/shared/config/swagger.errors.js';
import { healthSchema } from '@/shared/config/swagger.schemas.js';
import { registerAuthOpenapi } from '@/features/auth/auth.openapi.js';
import { registerPlaylistOpenapi } from '@/features/playlists/playlist.openapi.js';
import { registerProfileOpenapi } from '@/features/profile/profile.openapi.js';
import { registerSoundcloudOpenapi } from '@/features/soundcloud/soundcloud.openapi.js';
import { registerFriendsOpenapi } from '@/features/friends/friends.openapi.js';
import { registerMusicControlOpenapi } from '@/features/music-control/music-control.openapi.js';
import { registerQueueOpenapi } from '@/features/queue/queue.openapi.js';

/**
 * The OpenAPI document, generated from the Zod schemas each feature registers
 * in its `<name>.openapi.ts` (served at /api-docs and /api-docs.json).
 */

const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'bearerAuth', {
	type: 'http',
	scheme: 'bearer',
	bearerFormat: 'JWT',
	description: `
          JWT token from:
          - POST /api/auth/login
          - POST /api/auth/register
          - POST /api/auth/google
          - POST /api/auth/facebook

          Token expires after 1 hour. Use refresh token for renewal.

          Every protected route can also answer 429 RATE_LIMIT_EXCEEDED: after
          RATE_LIMIT_TOKEN_MAX (default 20) failed token verifications from an
          IP, every token from it is refused until the window ends
          (RATE_LIMIT_TOKEN_WINDOW_MS, default 15 minutes).
        `,
});
registerErrorComponents(registry);

registry.registerPath({
	method: 'get',
	path: '/health',
	tags: ['Health'],
	summary: 'Check server health',
	responses: {
		200: {
			description: 'Server healthy',
			content: {
				'application/json': {
					schema: healthSchema,
				},
			},
		},
	},
});

for (const register of [
	registerAuthOpenapi,
	registerPlaylistOpenapi,
	registerProfileOpenapi,
	registerSoundcloudOpenapi,
	registerFriendsOpenapi,
	registerMusicControlOpenapi,
	registerQueueOpenapi,
]) {
	register(registry);
}

const isProduction = env.NODE_ENV === 'production';

export const swaggerSpec = new OpenApiGeneratorV3(registry.definitions).generateDocument({
	openapi: '3.0.0',
	info: {
		title: 'Zumik API',
		version: '1.0.0',
		description: `Zumik - Collaborative music listening platform`,
		contact: { name: 'Zumik Team', email: 'contact@zumik.local' },
		license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
	},
	servers: [
		{
			url: isProduction ? 'https://api.zumik.com' : `http://localhost:${env.PORT || 3000}`,
			description: isProduction ? 'Production' : 'Development',
		},
	],
	tags: [
		{ name: 'Health', description: 'Server health check' },
		{ name: 'Authentication', description: 'User authentication and sessions' },
		{ name: 'OAuth', description: 'OAuth 2.0 (Google, Facebook)' },
		{ name: 'Profile', description: 'User profile management' },
		{ name: 'Playlists', description: 'Collaborative playlist CRUD' },
		{ name: 'Tracks', description: 'Playlist track management' },
		{ name: 'Collaborators', description: 'Playlist collaborator management' },
		{ name: 'SoundCloud', description: 'Music search and streaming (public)' },
		{ name: 'Friends', description: 'Friends system (follow/unfollow)' },
		{ name: 'Music Control', description: 'Music control delegation' },
		{ name: 'Queue', description: 'Play queue synced across your devices' },
	],
});

export const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
	customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { font-size: 36px; }
  `,
	customSiteTitle: 'Zumik API Documentation',
	swaggerOptions: {
		persistAuthorization: true,
		displayRequestDuration: true,
		docExpansion: 'list',
		filter: true,
		tryItOutEnabled: true,
		syntaxHighlight: {
			activate: true,
			theme: 'monokai',
		},
	},
};
