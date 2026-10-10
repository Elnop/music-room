import { OpenAPIV3 } from 'openapi-types';

/**
 * OpenAPI paths for Profile feature
 */
export const profilePaths: OpenAPIV3.PathsObject = {
	'/api/profile': {
		get: {
			tags: ['Profile'],
			summary: "Get current user's profile",
			operationId: 'getOwnProfile',
			security: [{ bearerAuth: [] }],
			responses: {
				'200': {
					description: 'Profile retrieved',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/UserProfile' },
										},
									},
								],
							},
						},
					},
				},
				'401': { $ref: '#/components/responses/UnauthorizedError' },
			},
		},
		patch: {
			tags: ['Profile'],
			summary: "Update current user's profile",
			operationId: 'updateProfile',
			security: [{ bearerAuth: [] }],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/UpdateProfileRequest' },
						example: {
							username: 'newusername',
							displayName: 'John Doe Updated',
							bio: 'Music enthusiast and playlist curator',
							avatarUrl: 'https://example.com/avatar.jpg',
						},
					},
				},
			},
			responses: {
				'200': {
					description: 'Profile updated',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/UserProfile' },
										},
									},
								],
							},
						},
					},
				},
				'400': { $ref: '#/components/responses/ValidationError' },
				'401': { $ref: '#/components/responses/UnauthorizedError' },
			},
		},
	},

	'/api/profile/search': {
		get: {
			tags: ['Profile'],
			summary: 'Search users by username or display name',
			operationId: 'searchUsers',
			security: [{ bearerAuth: [] }],
			parameters: [
				{
					in: 'query',
					name: 'q',
					required: true,
					schema: { type: 'string', minLength: 1 },
					description: 'Search query',
				},
				{
					in: 'query',
					name: 'limit',
					schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
					description: 'Maximum number of results',
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
													users: {
														type: 'array',
														items: { $ref: '#/components/schemas/UserProfile' },
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
				'401': { $ref: '#/components/responses/UnauthorizedError' },
			},
		},
	},

	'/api/profile/privacy': {
		get: {
			tags: ['Profile'],
			summary: "Get current user's privacy settings",
			operationId: 'getPrivacySettings',
			security: [{ bearerAuth: [] }],
			responses: {
				'200': {
					description: 'Privacy settings retrieved',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/PrivacySettings' },
										},
									},
								],
							},
						},
					},
				},
				'401': { $ref: '#/components/responses/UnauthorizedError' },
			},
		},
		put: {
			tags: ['Profile'],
			summary: "Update current user's privacy settings",
			operationId: 'updatePrivacySettings',
			security: [{ bearerAuth: [] }],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/UpdatePrivacySettingsRequest' },
						example: {
							bioVisibility: 'friends_only',
							emailVisibility: 'private',
						},
					},
				},
			},
			responses: {
				'200': {
					description: 'Privacy settings updated',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/PrivacySettings' },
										},
									},
								],
							},
						},
					},
				},
				'400': { $ref: '#/components/responses/ValidationError' },
				'401': { $ref: '#/components/responses/UnauthorizedError' },
			},
		},
	},

	'/api/profile/music-preferences': {
		get: {
			tags: ['Profile'],
			summary: "Get current user's music preferences",
			operationId: 'getMusicPreferences',
			security: [{ bearerAuth: [] }],
			responses: {
				'200': {
					description: 'Music preferences retrieved',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/MusicPreferences' },
										},
									},
								],
							},
						},
					},
				},
				'401': { $ref: '#/components/responses/UnauthorizedError' },
			},
		},
		put: {
			tags: ['Profile'],
			summary: "Update current user's music preferences",
			description: 'Set favorite genres (maximum 5)',
			operationId: 'updateMusicPreferences',
			security: [{ bearerAuth: [] }],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/UpdateMusicPreferencesRequest' },
						example: {
							favoriteGenres: ['electronic', 'hip-hop', 'jazz'],
						},
					},
				},
			},
			responses: {
				'200': {
					description: 'Music preferences updated',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/MusicPreferences' },
										},
									},
								],
							},
						},
					},
				},
				'400': { $ref: '#/components/responses/ValidationError' },
				'401': { $ref: '#/components/responses/UnauthorizedError' },
			},
		},
	},

	'/api/profile/music-preferences/genres': {
		get: {
			tags: ['Profile'],
			summary: 'Get all available music genres',
			operationId: 'getAvailableGenres',
			security: [{ bearerAuth: [] }],
			responses: {
				'200': {
					description: 'List of genres',
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
													genres: {
														type: 'array',
														items: { type: 'string' },
														example: ['rock', 'pop', 'electronic', 'hip-hop', 'jazz', 'classical'],
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
				'401': { $ref: '#/components/responses/UnauthorizedError' },
			},
		},
	},

	'/api/profile/{userId}': {
		get: {
			tags: ['Profile'],
			summary: 'Get user profile by ID',
			description:
				'Returns user profile filtered by privacy settings. Only visible fields are returned.',
			operationId: 'getProfileById',
			security: [{ bearerAuth: [] }],
			parameters: [
				{
					in: 'path',
					name: 'userId',
					required: true,
					schema: { type: 'string', format: 'uuid' },
					description: 'User ID',
				},
			],
			responses: {
				'200': {
					description: 'User profile retrieved',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/UserProfile' },
										},
									},
								],
							},
						},
					},
				},
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'404': { $ref: '#/components/responses/NotFoundError' },
			},
		},
	},
};

/**
 * Schemas specific to Profile
 */
export const profileSchemas: OpenAPIV3.ComponentsObject['schemas'] = {
	UpdateProfileRequest: {
		type: 'object',
		properties: {
			username: {
				type: 'string',
				minLength: 3,
				maxLength: 20,
				pattern: '^[a-zA-Z0-9_]+$',
				description: 'Alphanumeric and underscores only',
			},
			displayName: {
				type: 'string',
				maxLength: 50,
			},
			bio: {
				type: 'string',
				maxLength: 500,
			},
			avatarUrl: {
				type: 'string',
				format: 'uri',
			},
		},
	},

	PrivacySettings: {
		type: 'object',
		description:
			'Visibility of each profile field: public (everyone), friends_only (mutual follows), private (only you)',
		properties: {
			userId: { type: 'string', format: 'uuid' },
			emailVisibility: {
				type: 'string',
				enum: ['public', 'friends_only', 'private'],
				description: 'Who can see your email',
			},
			bioVisibility: {
				type: 'string',
				enum: ['public', 'friends_only', 'private'],
				description: 'Who can see your bio',
			},
			avatarVisibility: {
				type: 'string',
				enum: ['public', 'friends_only', 'private'],
				description: 'Who can see your avatar',
			},
			musicPreferencesVisibility: {
				type: 'string',
				enum: ['public', 'friends_only', 'private'],
				description: 'Who can see your music preferences',
			},
			createdAt: { type: 'string', format: 'date-time' },
			updatedAt: { type: 'string', format: 'date-time' },
		},
		required: [
			'userId',
			'emailVisibility',
			'bioVisibility',
			'avatarVisibility',
			'musicPreferencesVisibility',
			'createdAt',
			'updatedAt',
		],
	},

	UpdatePrivacySettingsRequest: {
		type: 'object',
		description: 'Fields to change; omitted fields keep their value, unknown fields are ignored',
		properties: {
			emailVisibility: {
				type: 'string',
				enum: ['public', 'friends_only', 'private'],
				description: 'Who can see your email',
			},
			bioVisibility: {
				type: 'string',
				enum: ['public', 'friends_only', 'private'],
				description: 'Who can see your bio',
			},
			avatarVisibility: {
				type: 'string',
				enum: ['public', 'friends_only', 'private'],
				description: 'Who can see your avatar',
			},
			musicPreferencesVisibility: {
				type: 'string',
				enum: ['public', 'friends_only', 'private'],
				description: 'Who can see your music preferences',
			},
		},
	},

	MusicPreferences: {
		type: 'object',
		properties: {
			favoriteGenres: {
				type: 'array',
				maxItems: 5,
				items: { type: 'string' },
				description: 'User favorite genres (max 5)',
			},
		},
	},

	UpdateMusicPreferencesRequest: {
		type: 'object',
		required: ['favoriteGenres'],
		properties: {
			favoriteGenres: {
				type: 'array',
				maxItems: 5,
				items: { type: 'string' },
				description: 'Array of genre names (max 5)',
			},
		},
	},
};
