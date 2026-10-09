import { OpenAPIV3 } from 'openapi-types';

/**
 * OpenAPI paths for Playlists feature
 */
export const playlistPaths: OpenAPIV3.PathsObject = {
	'/api/playlists': {
		get: {
			tags: ['Playlists'],
			summary: "Get user's playlists",
			description:
				'Returns playlists owned by or shared with the authenticated user (collaborator or viewer)',
			operationId: 'getUserPlaylists',
			security: [{ bearerAuth: [] }],
			responses: {
				'200': {
					description: 'List of playlists retrieved',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: {
												type: 'array',
												items: { $ref: '#/components/schemas/PlaylistSummary' },
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
		post: {
			tags: ['Playlists'],
			summary: 'Create new playlist',
			operationId: 'createPlaylist',
			security: [{ bearerAuth: [] }],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/CreatePlaylistRequest' },
						example: {
							name: 'Chill Vibes',
							description: 'Relaxing music for studying',
							visibility: 'public',
							editMode: 'open',
						},
					},
				},
			},
			responses: {
				'201': {
					description: 'Playlist created successfully',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/PlaylistDetail' },
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

	'/api/playlists/public': {
		get: {
			tags: ['Playlists'],
			summary: 'Get public playlists',
			description:
				"Returns up to 50 public playlists not owned by the authenticated user, newest first, each with its owner's profile and track count",
			operationId: 'getPublicPlaylists',
			security: [{ bearerAuth: [] }],
			responses: {
				'200': {
					description: 'Public playlists retrieved',
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
													playlists: {
														type: 'array',
														maxItems: 50,
														items: { $ref: '#/components/schemas/PlaylistResponse' },
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
				'500': {
					description: 'PLAYLIST_FETCH_ERROR: the public playlists could not be read',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							example: {
								success: false,
								error: {
									message: 'Failed to fetch public playlists',
									code: 'PLAYLIST_FETCH_ERROR',
								},
								meta: { timestamp: '2025-01-15T10:30:00.000Z' },
							},
						},
					},
				},
			},
		},
	},

	'/api/playlists/user/{userId}': {
		get: {
			tags: ['Playlists'],
			summary: "Get another user's visible playlists",
			description:
				'Returns public playlists and private playlists where authenticated user is invited',
			operationId: 'getPlaylistsByUser',
			security: [{ bearerAuth: [] }],
			parameters: [
				{
					in: 'path',
					name: 'userId',
					required: true,
					schema: { type: 'string', format: 'uuid' },
					description: 'User ID whose playlists to retrieve',
				},
			],
			responses: {
				'200': {
					description: 'Playlists retrieved',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: {
												type: 'array',
												items: { $ref: '#/components/schemas/PlaylistSummary' },
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

	'/api/playlists/{id}': {
		get: {
			tags: ['Playlists'],
			summary: 'Get playlist by ID with tracks',
			description: 'Returns playlist details including all tracks, collaborators, and viewers',
			operationId: 'getPlaylistById',
			security: [{ bearerAuth: [] }],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					schema: { type: 'string', format: 'uuid' },
					description: 'Playlist ID',
				},
			],
			responses: {
				'200': {
					description: 'Playlist retrieved',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/PlaylistDetail' },
										},
									},
								],
							},
						},
					},
				},
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'403': { $ref: '#/components/responses/ForbiddenError' },
				'404': { $ref: '#/components/responses/NotFoundError' },
			},
		},
		patch: {
			tags: ['Playlists'],
			summary: 'Update playlist metadata',
			description: 'Update name, description, visibility, or edit mode. Owner only.',
			operationId: 'updatePlaylist',
			security: [{ bearerAuth: [] }],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					schema: { type: 'string', format: 'uuid' },
				},
			],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/UpdatePlaylistRequest' },
						example: {
							name: 'Updated Playlist Name',
							description: 'New description',
							visibility: 'private',
							editMode: 'restricted',
						},
					},
				},
			},
			responses: {
				'200': {
					description: 'Playlist updated',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/PlaylistDetail' },
										},
									},
								],
							},
						},
					},
				},
				'400': { $ref: '#/components/responses/ValidationError' },
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'403': { $ref: '#/components/responses/ForbiddenError' },
				'404': { $ref: '#/components/responses/NotFoundError' },
			},
		},
		delete: {
			tags: ['Playlists'],
			summary: 'Delete playlist',
			description: 'Permanently delete playlist. Owner only.',
			operationId: 'deletePlaylist',
			security: [{ bearerAuth: [] }],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					schema: { type: 'string', format: 'uuid' },
				},
			],
			responses: {
				'200': {
					description: 'Playlist deleted',
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
													message: { type: 'string', example: 'Playlist deleted successfully' },
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
				'403': { $ref: '#/components/responses/ForbiddenError' },
				'404': { $ref: '#/components/responses/NotFoundError' },
			},
		},
	},

	'/api/playlists/{id}/tracks': {
		post: {
			tags: ['Tracks'],
			summary: 'Add track to playlist',
			description:
				'Appends a track at the end of the playlist and increments tracksVersion. Never refused because of concurrency. Owner and collaborators with edit permission can add tracks. See doc/PLAYLIST_CONCURRENCY.md.',
			operationId: 'addTrack',
			security: [{ bearerAuth: [] }],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					schema: { type: 'string', format: 'uuid' },
					description: 'Playlist ID',
				},
			],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/AddTrackRequest' },
						example: {
							trackUri: 'https://soundcloud.com/artist/track',
							title: 'Amazing Song',
							artist: 'Cool Artist',
							album: 'Great Album',
							albumArt: 'https://i1.sndcdn.com/artworks-xxx-large.jpg',
							durationMs: 240000,
							previewUrl: 'https://soundcloud.com/...',
						},
					},
				},
			},
			responses: {
				'201': {
					description: 'Track added to playlist',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/AddTrackResult' },
										},
									},
								],
							},
						},
					},
				},
				'400': { $ref: '#/components/responses/ValidationError' },
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'403': { $ref: '#/components/responses/ForbiddenError' },
				'404': { $ref: '#/components/responses/NotFoundError' },
				'409': {
					description: 'TRACK_DUPLICATE: the track is already in the playlist',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							example: {
								success: false,
								error: { code: 'TRACK_DUPLICATE', message: 'Track already in playlist' },
							},
						},
					},
				},
			},
		},
	},

	'/api/playlists/{id}/tracks/{trackId}': {
		delete: {
			tags: ['Tracks'],
			summary: 'Remove track from playlist',
			description:
				'Removes a track from the playlist. Owner and collaborators with edit permission can remove tracks.',
			operationId: 'removeTrack',
			security: [{ bearerAuth: [] }],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					schema: { type: 'string', format: 'uuid' },
					description: 'Playlist ID',
				},
				{
					in: 'path',
					name: 'trackId',
					required: true,
					schema: { type: 'string', format: 'uuid' },
					description: 'Track ID to remove',
				},
			],
			responses: {
				'200': {
					description: 'Track removed from playlist',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/RemoveTrackResult' },
										},
									},
								],
							},
						},
					},
				},
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'403': { $ref: '#/components/responses/ForbiddenError' },
				'404': {
					description:
						'PLAYLIST_NOT_FOUND: the playlist does not exist. TRACK_NOT_IN_PLAYLIST: the track is not (or no longer) in the playlist.',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							example: {
								success: false,
								error: { code: 'TRACK_NOT_IN_PLAYLIST', message: 'Track is not in the playlist' },
							},
						},
					},
				},
			},
		},
	},

	'/api/playlists/{id}/tracks/{trackId}/move': {
		post: {
			tags: ['Tracks'],
			summary: 'Move a track',
			description:
				'Places the track right after afterRank. Refused with 409 only when this same track moved or was removed since expectedVersion, or when the playlist ranks were rebalanced since then. See doc/PLAYLIST_CONCURRENCY.md.',
			operationId: 'moveTrack',
			security: [{ bearerAuth: [] }],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					schema: { type: 'string', format: 'uuid' },
					description: 'Playlist ID',
				},
				{
					in: 'path',
					name: 'trackId',
					required: true,
					schema: { type: 'string', format: 'uuid' },
					description: 'Track ID to move',
				},
			],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/MoveTrackRequest' },
						example: { afterRank: 'h', expectedVersion: 10 },
					},
				},
			},
			responses: {
				'200': {
					description: 'Track moved',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/MoveTrackResult' },
										},
									},
								],
							},
						},
					},
				},
				'400': { $ref: '#/components/responses/ValidationError' },
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'403': { $ref: '#/components/responses/ForbiddenError' },
				'404': { $ref: '#/components/responses/NotFoundError' },
				'409': {
					description:
						'TRACK_MOVED_CONCURRENTLY: the track moved since expectedVersion. TRACK_NOT_IN_PLAYLIST: it was removed. PLAYLIST_REBALANCED: every rank changed since expectedVersion. The client reloads the playlist.',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							example: {
								success: false,
								error: {
									code: 'TRACK_MOVED_CONCURRENTLY',
									message: 'Track was moved by someone else',
								},
							},
						},
					},
				},
			},
		},
	},

	'/api/playlists/{id}/collaborators': {
		post: {
			tags: ['Collaborators'],
			summary: 'Add collaborator to playlist',
			description: 'Grants edit permissions to another user. Owner only.',
			operationId: 'addCollaborator',
			security: [{ bearerAuth: [] }],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					schema: { type: 'string', format: 'uuid' },
				},
			],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/AddCollaboratorRequest' },
						example: {
							userId: '123e4567-e89b-12d3-a456-426614174000',
						},
					},
				},
			},
			responses: {
				'200': {
					description: 'Collaborator added',
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
													message: { type: 'string', example: 'Collaborator added successfully' },
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
				'403': { $ref: '#/components/responses/ForbiddenError' },
				'404': { $ref: '#/components/responses/NotFoundError' },
			},
		},
	},

	'/api/playlists/{id}/collaborators/{userId}': {
		delete: {
			tags: ['Collaborators'],
			summary: 'Remove collaborator from playlist',
			description: 'Revokes edit permissions from a collaborator. Owner only.',
			operationId: 'removeCollaborator',
			security: [{ bearerAuth: [] }],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					schema: { type: 'string', format: 'uuid' },
				},
				{
					in: 'path',
					name: 'userId',
					required: true,
					schema: { type: 'string', format: 'uuid' },
				},
			],
			responses: {
				'200': {
					description: 'Collaborator removed',
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
													message: { type: 'string', example: 'Collaborator removed successfully' },
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
				'403': { $ref: '#/components/responses/ForbiddenError' },
				'404': { $ref: '#/components/responses/NotFoundError' },
			},
		},
	},

	'/api/playlists/{id}/viewers': {
		get: {
			tags: ['Collaborators'],
			summary: 'Get all viewers of a playlist',
			description:
				'Returns list of users who have view-only access to this private playlist. Owner only.',
			operationId: 'getViewers',
			security: [{ bearerAuth: [] }],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					schema: { type: 'string', format: 'uuid' },
				},
			],
			responses: {
				'200': {
					description: 'Viewers retrieved',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: {
												type: 'array',
												items: { $ref: '#/components/schemas/PlaylistMember' },
											},
										},
									},
								],
							},
						},
					},
				},
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'403': { $ref: '#/components/responses/ForbiddenError' },
				'404': { $ref: '#/components/responses/NotFoundError' },
			},
		},
		post: {
			tags: ['Collaborators'],
			summary: 'Add viewer to playlist',
			description: 'Grants view-only access to a private playlist. Owner only.',
			operationId: 'addViewer',
			security: [{ bearerAuth: [] }],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					schema: { type: 'string', format: 'uuid' },
				},
			],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/AddViewerRequest' },
						example: {
							userId: '123e4567-e89b-12d3-a456-426614174000',
						},
					},
				},
			},
			responses: {
				'200': {
					description: 'Viewer added',
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
													message: { type: 'string', example: 'Viewer added successfully' },
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
				'403': { $ref: '#/components/responses/ForbiddenError' },
				'404': { $ref: '#/components/responses/NotFoundError' },
			},
		},
	},

	'/api/playlists/{id}/viewers/{userId}': {
		delete: {
			tags: ['Collaborators'],
			summary: 'Remove viewer from playlist',
			description: 'Revokes view-only access from a viewer. Owner only.',
			operationId: 'removeViewer',
			security: [{ bearerAuth: [] }],
			parameters: [
				{
					in: 'path',
					name: 'id',
					required: true,
					schema: { type: 'string', format: 'uuid' },
				},
				{
					in: 'path',
					name: 'userId',
					required: true,
					schema: { type: 'string', format: 'uuid' },
				},
			],
			responses: {
				'200': {
					description: 'Viewer removed',
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
													message: { type: 'string', example: 'Viewer removed successfully' },
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
				'403': { $ref: '#/components/responses/ForbiddenError' },
				'404': { $ref: '#/components/responses/NotFoundError' },
			},
		},
	},
};

/**
 * Schemas specific to Playlists
 */
export const playlistSchemas: OpenAPIV3.ComponentsObject['schemas'] = {
	CreatePlaylistRequest: {
		type: 'object',
		required: ['name'],
		properties: {
			name: {
				type: 'string',
				minLength: 1,
				maxLength: 100,
				example: 'Chill Vibes',
			},
			description: {
				type: 'string',
				maxLength: 500,
				example: 'Relaxing music for studying',
			},
			visibility: {
				type: 'string',
				enum: ['public', 'private'],
				default: 'public',
				description: 'Playlist visibility',
			},
			editMode: {
				type: 'string',
				enum: ['open', 'restricted'],
				default: 'open',
				description:
					'Edit mode: open (anyone with access can edit) or restricted (only collaborators)',
			},
		},
	},

	UpdatePlaylistRequest: {
		type: 'object',
		properties: {
			name: {
				type: 'string',
				minLength: 1,
				maxLength: 100,
			},
			description: {
				type: 'string',
				maxLength: 500,
			},
			visibility: {
				type: 'string',
				enum: ['public', 'private'],
			},
			editMode: {
				type: 'string',
				enum: ['open', 'restricted'],
			},
		},
	},

	AddTrackRequest: {
		type: 'object',
		required: ['trackUri', 'title', 'artist', 'durationMs'],
		properties: {
			trackUri: {
				type: 'string',
				minLength: 1,
				maxLength: 500,
				example: 'https://soundcloud.com/artist/track',
				description: 'Universal track identifier (e.g., SoundCloud permalink)',
			},
			title: {
				type: 'string',
				minLength: 1,
				maxLength: 200,
				example: 'Amazing Song',
			},
			artist: {
				type: 'string',
				minLength: 1,
				maxLength: 200,
				example: 'Cool Artist',
			},
			album: {
				type: 'string',
				maxLength: 200,
				example: 'Great Album',
				description: 'Optional - not all services provide album info',
			},
			albumArt: {
				type: 'string',
				format: 'uri',
				example: 'https://i1.sndcdn.com/artworks-xxx-large.jpg',
			},
			durationMs: {
				type: 'integer',
				minimum: 1,
				example: 240000,
				description: 'Track duration in milliseconds',
			},
			previewUrl: {
				type: 'string',
				format: 'uri',
				description: 'Preview/stream URL',
			},
		},
	},

	AddCollaboratorRequest: {
		type: 'object',
		required: ['userId'],
		properties: {
			userId: {
				type: 'string',
				format: 'uuid',
				description: 'User ID to add as collaborator',
			},
		},
	},

	AddViewerRequest: {
		type: 'object',
		required: ['userId'],
		properties: {
			userId: {
				type: 'string',
				format: 'uuid',
				description: 'User ID to add as viewer',
			},
		},
	},

	PlaylistSummary: {
		type: 'object',
		properties: {
			id: { type: 'string', format: 'uuid' },
			name: { type: 'string' },
			description: { type: 'string', nullable: true },
			coverUrl: { type: 'string', format: 'uri', nullable: true },
			visibility: { type: 'string', enum: ['public', 'private'] },
			editMode: { type: 'string', enum: ['open', 'restricted'] },
			trackCount: { type: 'integer', example: 10 },
			owner: { $ref: '#/components/schemas/PlaylistMember' },
			createdAt: { type: 'string', format: 'date-time' },
			updatedAt: { type: 'string', format: 'date-time' },
		},
	},

	PlaylistDetail: {
		type: 'object',
		properties: {
			id: { type: 'string', format: 'uuid' },
			name: { type: 'string' },
			description: { type: 'string', nullable: true },
			coverUrl: { type: 'string', format: 'uri', nullable: true },
			visibility: { type: 'string', enum: ['public', 'private'] },
			editMode: { type: 'string', enum: ['open', 'restricted'] },
			owner: { $ref: '#/components/schemas/PlaylistMember' },
			tracksVersion: {
				type: 'integer',
				description: 'Incremented by every add, remove and move; sent back as expectedVersion',
				example: 10,
			},
			tracks: {
				type: 'array',
				description: 'Tracks ordered by rank',
				items: { $ref: '#/components/schemas/PlaylistTrack' },
			},
			collaborators: {
				type: 'array',
				items: { $ref: '#/components/schemas/PlaylistMember' },
			},
			viewers: {
				type: 'array',
				items: { $ref: '#/components/schemas/PlaylistMember' },
			},
			createdAt: { type: 'string', format: 'date-time' },
			updatedAt: { type: 'string', format: 'date-time' },
		},
	},

	PlaylistTrack: {
		type: 'object',
		properties: {
			id: { type: 'string', format: 'uuid' },
			trackUri: { type: 'string', description: 'Universal track identifier' },
			title: { type: 'string' },
			artist: { type: 'string' },
			album: { type: 'string', nullable: true },
			albumArt: { type: 'string', format: 'uri', nullable: true },
			durationMs: { type: 'integer' },
			previewUrl: { type: 'string', format: 'uri', nullable: true },
			rank: {
				type: 'string',
				description: 'Sort key: tracks are ordered by rank, compared byte by byte',
				example: 'h',
			},
			addedBy: {
				type: 'string',
				format: 'uuid',
				nullable: true,
				description: 'ID of the user who added the track',
			},
			addedAt: { type: 'string', format: 'date-time' },
			createdAt: { type: 'string', format: 'date-time' },
			updatedAt: { type: 'string', format: 'date-time' },
		},
	},

	MoveTrackRequest: {
		type: 'object',
		required: ['afterRank', 'expectedVersion'],
		properties: {
			afterRank: {
				type: 'string',
				nullable: true,
				pattern: '^[0-9A-Za-z]*[1-9A-Za-z]$',
				minLength: 1,
				maxLength: 128,
				description:
					'Rank of the track the moved track is dropped after, as the client displayed it; null for the top of the list.',
				example: 'h',
			},
			expectedVersion: {
				type: 'integer',
				minimum: 0,
				description: 'tracksVersion the client was displaying when the user moved the track.',
				example: 10,
			},
		},
	},

	AddTrackResult: {
		type: 'object',
		properties: {
			track: { $ref: '#/components/schemas/PlaylistTrack' },
			tracksVersion: { type: 'integer', example: 11 },
			rebalanced: { type: 'boolean', description: 'Every rank of the playlist changed' },
		},
	},

	RemoveTrackResult: {
		type: 'object',
		properties: { tracksVersion: { type: 'integer', example: 12 } },
	},

	MoveTrackResult: {
		type: 'object',
		properties: {
			trackId: { type: 'string', format: 'uuid' },
			rank: { type: 'string', example: 'l' },
			tracksVersion: { type: 'integer', example: 11 },
			rebalanced: { type: 'boolean', description: 'Every rank of the playlist changed' },
		},
	},

	PlaylistResponse: {
		type: 'object',
		required: [
			'id',
			'name',
			'ownerId',
			'collaboratorIds',
			'viewerIds',
			'visibility',
			'editMode',
			'trackCount',
			'createdAt',
			'updatedAt',
		],
		properties: {
			id: { type: 'string', format: 'uuid' },
			name: { type: 'string' },
			description: { type: 'string' },
			coverUrl: { type: 'string', format: 'uri' },
			firstTrackCover: {
				type: 'string',
				format: 'uri',
				description: 'Album art of the first track by rank, when it has one',
			},
			ownerId: { type: 'string', format: 'uuid' },
			owner: { $ref: '#/components/schemas/PlaylistMember' },
			collaboratorIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
			viewerIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
			visibility: { type: 'string', enum: ['public', 'private'] },
			editMode: { type: 'string', enum: ['open', 'restricted'] },
			trackCount: { type: 'integer', example: 10 },
			createdAt: { type: 'string', format: 'date-time' },
			updatedAt: { type: 'string', format: 'date-time' },
		},
	},

	PlaylistMember: {
		type: 'object',
		properties: {
			id: { type: 'string', format: 'uuid' },
			username: { type: 'string' },
			displayName: { type: 'string', nullable: true },
			avatarUrl: { type: 'string', format: 'uri', nullable: true },
		},
	},
};
