import { OpenAPIV3 } from 'openapi-types';

/**
 * OpenAPI paths for Playlists feature
 */
export const playlistPaths: OpenAPIV3.PathsObject = {
  '/api/playlists': {
    get: {
      tags: ['Playlists'],
      summary: "Get user's playlists",
      description: 'Returns playlists owned by or shared with the authenticated user (collaborator or viewer)',
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
                        items: { $ref: '#/components/schemas/PlaylistSummary' }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '401': { $ref: '#/components/responses/UnauthorizedError' }
      }
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
              editMode: 'open'
            }
          }
        }
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
                      data: { $ref: '#/components/schemas/PlaylistDetail' }
                    }
                  }
                ]
              }
            }
          }
        },
        '400': { $ref: '#/components/responses/ValidationError' },
        '401': { $ref: '#/components/responses/UnauthorizedError' }
      }
    }
  },

  '/api/playlists/user/{userId}': {
    get: {
      tags: ['Playlists'],
      summary: "Get another user's visible playlists",
      description: 'Returns public playlists and private playlists where authenticated user is invited',
      operationId: 'getPlaylistsByUser',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'User ID whose playlists to retrieve'
        }
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
                        items: { $ref: '#/components/schemas/PlaylistSummary' }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '401': { $ref: '#/components/responses/UnauthorizedError' }
      }
    }
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
          description: 'Playlist ID'
        }
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
                      data: { $ref: '#/components/schemas/PlaylistDetail' }
                    }
                  }
                ]
              }
            }
          }
        },
        '401': { $ref: '#/components/responses/UnauthorizedError' },
        '403': { $ref: '#/components/responses/ForbiddenError' },
        '404': { $ref: '#/components/responses/NotFoundError' }
      }
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
          schema: { type: 'string', format: 'uuid' }
        }
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
              editMode: 'restricted'
            }
          }
        }
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
                      data: { $ref: '#/components/schemas/PlaylistDetail' }
                    }
                  }
                ]
              }
            }
          }
        },
        '400': { $ref: '#/components/responses/ValidationError' },
        '401': { $ref: '#/components/responses/UnauthorizedError' },
        '403': { $ref: '#/components/responses/ForbiddenError' },
        '404': { $ref: '#/components/responses/NotFoundError' }
      }
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
          schema: { type: 'string', format: 'uuid' }
        }
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
                          message: { type: 'string', example: 'Playlist deleted successfully' }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '401': { $ref: '#/components/responses/UnauthorizedError' },
        '403': { $ref: '#/components/responses/ForbiddenError' },
        '404': { $ref: '#/components/responses/NotFoundError' }
      }
    }
  },

  '/api/playlists/{id}/tracks': {
    post: {
      tags: ['Tracks'],
      summary: 'Add track to playlist',
      description: 'Adds a new track to the playlist. Owner and collaborators with edit permission can add tracks.',
      operationId: 'addTrack',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Playlist ID'
        }
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
              previewUrl: 'https://soundcloud.com/...'
            }
          }
        }
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
                      data: { $ref: '#/components/schemas/PlaylistTrack' }
                    }
                  }
                ]
              }
            }
          }
        },
        '400': { $ref: '#/components/responses/ValidationError' },
        '401': { $ref: '#/components/responses/UnauthorizedError' },
        '403': { $ref: '#/components/responses/ForbiddenError' },
        '404': { $ref: '#/components/responses/NotFoundError' }
      }
    }
  },

  '/api/playlists/{id}/tracks/{trackId}': {
    delete: {
      tags: ['Tracks'],
      summary: 'Remove track from playlist',
      description: 'Removes a track from the playlist. Owner and collaborators with edit permission can remove tracks.',
      operationId: 'removeTrack',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Playlist ID'
        },
        {
          in: 'path',
          name: 'trackId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Track ID to remove'
        }
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
                      data: {
                        type: 'object',
                        properties: {
                          message: { type: 'string', example: 'Track removed successfully' }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '401': { $ref: '#/components/responses/UnauthorizedError' },
        '403': { $ref: '#/components/responses/ForbiddenError' },
        '404': { $ref: '#/components/responses/NotFoundError' }
      }
    }
  },

  '/api/playlists/{id}/tracks/reorder': {
    put: {
      tags: ['Tracks'],
      summary: 'Reorder tracks in playlist',
      description: 'Changes the order of tracks in the playlist. Provide array of track IDs in desired order.',
      operationId: 'reorderTracks',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ReorderTracksRequest' },
            example: {
              trackIds: [
                '123e4567-e89b-12d3-a456-426614174003',
                '123e4567-e89b-12d3-a456-426614174001',
                '123e4567-e89b-12d3-a456-426614174002'
              ]
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Tracks reordered',
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
                          message: { type: 'string', example: 'Tracks reordered successfully' }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '400': { $ref: '#/components/responses/ValidationError' },
        '401': { $ref: '#/components/responses/UnauthorizedError' },
        '403': { $ref: '#/components/responses/ForbiddenError' },
        '404': { $ref: '#/components/responses/NotFoundError' }
      }
    }
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
          schema: { type: 'string', format: 'uuid' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AddCollaboratorRequest' },
            example: {
              userId: '123e4567-e89b-12d3-a456-426614174000'
            }
          }
        }
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
                          message: { type: 'string', example: 'Collaborator added successfully' }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '400': { $ref: '#/components/responses/ValidationError' },
        '401': { $ref: '#/components/responses/UnauthorizedError' },
        '403': { $ref: '#/components/responses/ForbiddenError' },
        '404': { $ref: '#/components/responses/NotFoundError' }
      }
    }
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
          schema: { type: 'string', format: 'uuid' }
        },
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        }
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
                          message: { type: 'string', example: 'Collaborator removed successfully' }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '401': { $ref: '#/components/responses/UnauthorizedError' },
        '403': { $ref: '#/components/responses/ForbiddenError' },
        '404': { $ref: '#/components/responses/NotFoundError' }
      }
    }
  },

  '/api/playlists/{id}/viewers': {
    get: {
      tags: ['Collaborators'],
      summary: 'Get all viewers of a playlist',
      description: 'Returns list of users who have view-only access to this private playlist. Owner only.',
      operationId: 'getViewers',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        }
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
                        items: { $ref: '#/components/schemas/PlaylistMember' }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '401': { $ref: '#/components/responses/UnauthorizedError' },
        '403': { $ref: '#/components/responses/ForbiddenError' },
        '404': { $ref: '#/components/responses/NotFoundError' }
      }
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
          schema: { type: 'string', format: 'uuid' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AddViewerRequest' },
            example: {
              userId: '123e4567-e89b-12d3-a456-426614174000'
            }
          }
        }
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
                          message: { type: 'string', example: 'Viewer added successfully' }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '400': { $ref: '#/components/responses/ValidationError' },
        '401': { $ref: '#/components/responses/UnauthorizedError' },
        '403': { $ref: '#/components/responses/ForbiddenError' },
        '404': { $ref: '#/components/responses/NotFoundError' }
      }
    }
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
          schema: { type: 'string', format: 'uuid' }
        },
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: { type: 'string', format: 'uuid' }
        }
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
                          message: { type: 'string', example: 'Viewer removed successfully' }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '401': { $ref: '#/components/responses/UnauthorizedError' },
        '403': { $ref: '#/components/responses/ForbiddenError' },
        '404': { $ref: '#/components/responses/NotFoundError' }
      }
    }
  }
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
        example: 'Chill Vibes'
      },
      description: {
        type: 'string',
        maxLength: 500,
        example: 'Relaxing music for studying'
      },
      visibility: {
        type: 'string',
        enum: ['public', 'private'],
        default: 'public',
        description: 'Playlist visibility'
      },
      editMode: {
        type: 'string',
        enum: ['open', 'restricted'],
        default: 'open',
        description: 'Edit mode: open (anyone with access can edit) or restricted (only collaborators)'
      }
    }
  },

  UpdatePlaylistRequest: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      description: {
        type: 'string',
        maxLength: 500
      },
      visibility: {
        type: 'string',
        enum: ['public', 'private']
      },
      editMode: {
        type: 'string',
        enum: ['open', 'restricted']
      }
    }
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
        description: 'Universal track identifier (e.g., SoundCloud permalink)'
      },
      title: {
        type: 'string',
        minLength: 1,
        maxLength: 200,
        example: 'Amazing Song'
      },
      artist: {
        type: 'string',
        minLength: 1,
        maxLength: 200,
        example: 'Cool Artist'
      },
      album: {
        type: 'string',
        maxLength: 200,
        example: 'Great Album',
        description: 'Optional - not all services provide album info'
      },
      albumArt: {
        type: 'string',
        format: 'uri',
        example: 'https://i1.sndcdn.com/artworks-xxx-large.jpg'
      },
      durationMs: {
        type: 'integer',
        minimum: 1,
        example: 240000,
        description: 'Track duration in milliseconds'
      },
      previewUrl: {
        type: 'string',
        format: 'uri',
        description: 'Preview/stream URL'
      }
    }
  },

  ReorderTracksRequest: {
    type: 'object',
    required: ['trackIds'],
    properties: {
      trackIds: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'string',
          format: 'uuid'
        },
        description: 'Array of track IDs in desired order',
        example: [
          '123e4567-e89b-12d3-a456-426614174003',
          '123e4567-e89b-12d3-a456-426614174001',
          '123e4567-e89b-12d3-a456-426614174002'
        ]
      }
    }
  },

  AddCollaboratorRequest: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: {
        type: 'string',
        format: 'uuid',
        description: 'User ID to add as collaborator'
      }
    }
  },

  AddViewerRequest: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: {
        type: 'string',
        format: 'uuid',
        description: 'User ID to add as viewer'
      }
    }
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
      updatedAt: { type: 'string', format: 'date-time' }
    }
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
      tracks: {
        type: 'array',
        items: { $ref: '#/components/schemas/PlaylistTrack' }
      },
      collaborators: {
        type: 'array',
        items: { $ref: '#/components/schemas/PlaylistMember' }
      },
      viewers: {
        type: 'array',
        items: { $ref: '#/components/schemas/PlaylistMember' }
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
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
      position: { type: 'integer', description: 'Track position in playlist' },
      addedBy: { $ref: '#/components/schemas/PlaylistMember' },
      createdAt: { type: 'string', format: 'date-time' }
    }
  },

  PlaylistMember: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      username: { type: 'string' },
      displayName: { type: 'string', nullable: true },
      avatarUrl: { type: 'string', format: 'uri', nullable: true }
    }
  }
};
