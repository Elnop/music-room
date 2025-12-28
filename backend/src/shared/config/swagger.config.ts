import { OpenAPIV3 } from 'openapi-types';
import swaggerUi from 'swagger-ui-express';
import { env } from './env.js';
import { commonSchemas, commonResponses } from './swagger.schemas.js';

// Imports des specs par feature
import { authPaths, authSchemas } from '@/features/auth/auth.openapi.js';
import { playlistPaths, playlistSchemas } from '@/features/playlists/playlist.openapi.js';
import { profilePaths, profileSchemas } from '@/features/profile/profile.openapi.js';
import { soundcloudPaths, soundcloudSchemas } from '@/features/soundcloud/soundcloud.openapi.js';
import { friendsPaths, friendsSchemas } from '@/features/friends/friends.openapi.js';
import { musicControlPaths, musicControlSchemas } from '@/features/music-control/music-control.openapi.js';

const openapiDocument: OpenAPIV3.Document = {
	openapi: '3.0.0',
	info: {
		title: 'Music Room API',
		version: '1.0.0',
		description: `Music Room - Collaborative music listening platform`,
		contact: {
			name: 'Music Room Team',
			email: 'contact@music-room.local'
		},
		license: {
			name: 'MIT',
			url: 'https://opensource.org/licenses/MIT'
		}
	},

	servers: [
		{
			url: env.NODE_ENV === 'production'
				? 'https://api.music-room.com'
				: `http://localhost:${env.PORT || 3000}`,
			description: env.NODE_ENV === 'production' ? 'Production' : 'Development'
		}
	],

	// Merge tous les paths des features
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
										redis: { type: 'string', enum: ['connected', 'disconnected'] }
									}
								}
							}
						}
					}
				}
			}
		},
		// Feature paths
		...authPaths,
		...playlistPaths,
		...profilePaths,
		...soundcloudPaths,
		...friendsPaths,
		...musicControlPaths
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
        `
			}
		},

		// Merge tous les schemas
		schemas: {
			...commonSchemas,
			// Feature schemas
			...authSchemas,
			...playlistSchemas,
			...profileSchemas,
			...soundcloudSchemas,
			...friendsSchemas,
			...musicControlSchemas
		},

		// Responses communes
		responses: commonResponses
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
		{ name: 'Music Control', description: 'Music control delegation' }
	]
};

export const swaggerSpec = openapiDocument;

export const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
	customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { font-size: 36px; }
  `,
	customSiteTitle: 'Music Room API Documentation',
	swaggerOptions: {
		persistAuthorization: true,
		displayRequestDuration: true,
		docExpansion: 'list',
		filter: true,
		tryItOutEnabled: true,
		syntaxHighlight: {
			activate: true,
			theme: 'monokai'
		}
	}
};
