import { OpenAPIV3 } from 'openapi-types';

/**
 * Responses shared by every SoundCloud route: authenticated, then rate limited
 * per user (RATE_LIMIT_SOUNDCLOUD_MAX per RATE_LIMIT_SOUNDCLOUD_WINDOW_MS,
 * default 120 per minute), Redis only.
 */
const protectedResponses: OpenAPIV3.ResponsesObject = {
	'401': { $ref: '#/components/responses/UnauthorizedError' },
	'429': {
		description:
			'RATE_LIMIT_EXCEEDED: too many SoundCloud requests from this user in the window (default 120 per minute), or, before authentication, too many failed token verifications from this IP (#160); `error.retryAfter` gives the end of the window',
		content: {
			'application/json': {
				schema: { $ref: '#/components/schemas/ErrorResponse' },
				example: {
					success: false,
					error: {
						message: 'Too many SoundCloud requests. Please try again later.',
						code: 'RATE_LIMIT_EXCEEDED',
						retryAfter: '2025-01-15T10:31:00.000Z',
					},
					meta: { timestamp: '2025-01-15T10:30:00.000Z' },
				},
			},
		},
	},
	'503': {
		description:
			'Redis is not ready (fail closed). REVOCATION_UNAVAILABLE: authMiddleware cannot check the logout denylist (it runs first, so this is what a client sees when Redis is down). RATE_LIMIT_UNAVAILABLE: the SoundCloud limiter cannot count the request.',
		content: {
			'application/json': {
				schema: { $ref: '#/components/schemas/ErrorResponse' },
				example: {
					success: false,
					error: { message: 'Session revocation is unavailable', code: 'REVOCATION_UNAVAILABLE' },
					meta: { timestamp: '2025-01-15T10:30:00.000Z' },
				},
			},
		},
	},
};

const SOUNDCLOUD_URL_RULE =
	'an https URL on `soundcloud.com`, `www.soundcloud.com`, `m.soundcloud.com` or `on.soundcloud.com`';

/** 400 of the stream routes: url missing, or not a SoundCloud URL. */
const streamBadRequest: OpenAPIV3.ResponseObject = {
	description: `MISSING_TRACK_URL: the track URL is missing or empty. VALIDATION_ERROR: it is not ${SOUNDCLOUD_URL_RULE}`,
	content: {
		'application/json': {
			schema: { $ref: '#/components/schemas/ErrorResponse' },
			examples: {
				missing: {
					value: {
						success: false,
						error: { message: 'Track URL is required', code: 'MISSING_TRACK_URL' },
						meta: { timestamp: '2025-01-15T10:30:00.000Z' },
					},
				},
				invalid: {
					value: {
						success: false,
						error: {
							message: 'Validation error',
							code: 'VALIDATION_ERROR',
							details: [
								{
									path: 'url',
									message: 'Must be a https SoundCloud URL (soundcloud.com, www., m. or on.)',
								},
							],
						},
						meta: { timestamp: '2025-01-15T10:30:00.000Z' },
					},
				},
			},
		},
	},
};

/**
 * OpenAPI paths for SoundCloud feature
 * Every endpoint requires a bearer token and is rate limited per user.
 */
export const soundcloudPaths: OpenAPIV3.PathsObject = {
	'/api/soundcloud/search': {
		get: {
			tags: ['SoundCloud'],
			security: [{ bearerAuth: [] }],
			summary: 'Search SoundCloud tracks',
			description:
				'Requires authentication; rate limited per user. Returns list of tracks matching search query.',
			operationId: 'searchSoundCloudTracks',
			parameters: [
				{
					in: 'query',
					name: 'q',
					required: true,
					schema: { type: 'string', minLength: 1 },
					description: 'Search query',
					example: 'lofi hip hop',
				},
				{
					in: 'query',
					name: 'limit',
					schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
					description: 'Maximum number of results',
				},
				{
					in: 'query',
					name: 'offset',
					schema: { type: 'integer', minimum: 0, default: 0 },
					description: 'Pagination offset',
				},
			],
			responses: {
				'200': {
					description: 'Search results',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: {
												type: 'object',
												properties: {
													tracks: {
														type: 'array',
														items: { $ref: '#/components/schemas/SoundCloudTrack' },
													},
													count: { type: 'integer' },
												},
											},
										},
									},
								],
							},
						},
					},
				},
				'400': { $ref: '#/components/responses/ValidationError' },
				...protectedResponses,
			},
		},
	},

	'/api/soundcloud/track/{urlOrId}': {
		get: {
			tags: ['SoundCloud'],
			security: [{ bearerAuth: [] }],
			summary: 'Get SoundCloud track details',
			description:
				'Requires authentication; rate limited per user. Fetches track metadata by SoundCloud URL (URL-encoded) or numeric ID.',
			operationId: 'getSoundCloudTrack',
			parameters: [
				{
					in: 'path',
					name: 'urlOrId',
					required: true,
					schema: { type: 'string' },
					description: `URL-encoded SoundCloud track URL (${SOUNDCLOUD_URL_RULE}) or numeric track ID`,
					example: '123456789',
				},
			],
			responses: {
				'200': {
					description: 'Track details',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/SoundCloudTrack' },
										},
									},
								],
							},
						},
					},
				},
				'400': { $ref: '#/components/responses/ValidationError' },
				'404': { $ref: '#/components/responses/NotFoundError' },
				...protectedResponses,
			},
		},
	},

	'/api/soundcloud/stream': {
		get: {
			tags: ['SoundCloud'],
			security: [{ bearerAuth: [] }],
			summary: 'Get SoundCloud stream URL',
			description:
				'Requires authentication; rate limited per user. Returns AAC HLS stream URL for playback. The track URL goes in the query string (a URL in the path can be blocked by Cloudflare WAF); `/api/soundcloud/stream/{trackUrl}` is the legacy form.',
			operationId: 'getSoundCloudStreamUrlByQuery',
			parameters: [
				{
					in: 'query',
					name: 'url',
					required: true,
					schema: { type: 'string' },
					description: `URL-encoded SoundCloud track permalink URL: ${SOUNDCLOUD_URL_RULE}`,
					example: 'https%3A%2F%2Fsoundcloud.com%2Fartist%2Ftrack',
				},
			],
			responses: {
				'200': {
					description: 'Stream URL retrieved',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: {
												type: 'object',
												properties: {
													streamUrl: {
														type: 'string',
														format: 'uri',
														description: 'HLS AAC stream URL (expires after 30 minutes)',
													},
													expiresAt: {
														type: 'string',
														format: 'date-time',
														description:
															'When the stream URL expires; request a new one shortly before',
													},
												},
											},
										},
									},
								],
							},
						},
					},
				},
				'400': streamBadRequest,
				'404': { $ref: '#/components/responses/NotFoundError' },
				...protectedResponses,
			},
		},
	},

	'/api/soundcloud/stream/{trackUrl}': {
		get: {
			tags: ['SoundCloud'],
			security: [{ bearerAuth: [] }],
			summary: 'Get SoundCloud stream URL',
			description:
				'Requires authentication; rate limited per user. Returns AAC HLS stream URL for playback. Legacy form of `/api/soundcloud/stream?url=`, same validation.',
			operationId: 'getSoundCloudStreamUrl',
			parameters: [
				{
					in: 'path',
					name: 'trackUrl',
					required: true,
					schema: { type: 'string' },
					description: `URL-encoded SoundCloud track URL: ${SOUNDCLOUD_URL_RULE}`,
					example: 'https%3A%2F%2Fsoundcloud.com%2Fartist%2Ftrack',
				},
			],
			responses: {
				'200': {
					description: 'Stream URL retrieved',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: {
												type: 'object',
												properties: {
													streamUrl: {
														type: 'string',
														format: 'uri',
														description: 'HLS AAC stream URL (expires after 30 minutes)',
													},
													expiresAt: {
														type: 'string',
														format: 'date-time',
														description:
															'When the stream URL expires; request a new one shortly before',
													},
												},
											},
										},
									},
								],
							},
						},
					},
				},
				'400': streamBadRequest,
				'404': { $ref: '#/components/responses/NotFoundError' },
				...protectedResponses,
			},
		},
	},
};

/**
 * Schemas specific to SoundCloud
 */
export const soundcloudSchemas: OpenAPIV3.ComponentsObject['schemas'] = {
	SoundCloudTrack: {
		type: 'object',
		properties: {
			id: { type: 'integer', description: 'SoundCloud track ID' },
			title: { type: 'string' },
			artist: { type: 'string', description: 'Artist username' },
			trackUri: {
				type: 'string',
				format: 'uri',
				description: 'SoundCloud permalink URL',
			},
			albumArt: {
				type: 'string',
				format: 'uri',
				nullable: true,
				description: 'Artwork URL (large resolution)',
			},
			durationMs: {
				type: 'integer',
				description: 'Track duration in milliseconds',
			},
			playbackCount: {
				type: 'integer',
				description: 'Number of plays',
			},
			genre: {
				type: 'string',
				nullable: true,
			},
			createdAt: {
				type: 'string',
				format: 'date-time',
				description: 'Track upload date',
			},
			policy: {
				type: 'string',
				description: "SoundCloud's access policy, e.g. ALLOW, or SNIP for a 30-second preview",
			},
			media: {
				type: 'object',
				properties: {
					transcodings: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								snipped: {
									type: 'boolean',
									description: 'True when this stream is only the 30-second preview',
								},
							},
						},
					},
				},
			},
		},
	},
};
