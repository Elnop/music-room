import { OpenAPIV3 } from 'openapi-types';
import swaggerUi from 'swagger-ui-express';
import { env } from './env.js';
import { commonSchemas, commonResponses } from './swagger.schemas.js';

// Feature specs imports
import { authPaths, authSchemas } from '@/features/auth/auth.openapi.js';
import { playlistPaths, playlistSchemas } from '@/features/playlists/playlist.openapi.js';
import { profilePaths, profileSchemas } from '@/features/profile/profile.openapi.js';
import { soundcloudPaths, soundcloudSchemas } from '@/features/soundcloud/soundcloud.openapi.js';
import { friendsPaths, friendsSchemas } from '@/features/friends/friends.openapi.js';
import {
	musicControlPaths,
	musicControlSchemas,
} from '@/features/music-control/music-control.openapi.js';
import { queuePaths, queueSchemas } from '@/features/queue/queue.openapi.js';

const openapiDocument: OpenAPIV3.Document = {
	openapi: '3.0.0',
	info: {
		title: 'Zumik API',
		version: '1.0.0',
		description: `Zumik - Collaborative music listening platform`,
		contact: {
			name: 'Zumik Team',
			email: 'contact@zumik.local',
		},
		license: {
			name: 'MIT',
			url: 'https://opensource.org/licenses/MIT',
		},
	},

	servers: [
		{
			url:
				env.NODE_ENV === 'production'
					? 'https://api.zumik.com'
					: `http://localhost:${env.PORT || 3000}`,
			description: env.NODE_ENV === 'production' ? 'Production' : 'Development',
		},
	],

	// Merge all feature paths
	paths: {
		'/health': {
			get: {
				tags: ['Health'],
				summary: 'Check server health',
				responses: {
					'200': {
						description: 'Server healthy',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										status: { type: 'string', example: 'ok' },
										timestamp: { type: 'string', format: 'date-time' },
										redis: { type: 'string', enum: ['connected', 'disconnected'] },
									},
								},
							},
						},
					},
				},
			},
		},
		// Feature paths
		...authPaths,
		...playlistPaths,
		...profilePaths,
		...soundcloudPaths,
		...friendsPaths,
		...musicControlPaths,
		...queuePaths,
	},

	components: {
		securitySchemes: {
			bearerAuth: {
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
			},
		},

		// Merge all schemas
		schemas: {
			...commonSchemas,
			// Feature schemas
			...authSchemas,
			...playlistSchemas,
			...profileSchemas,
			...soundcloudSchemas,
			...friendsSchemas,
			...musicControlSchemas,
			...queueSchemas,
		},

		// Common responses
		responses: commonResponses,
	},

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
};

export const swaggerSpec = openapiDocument;

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
