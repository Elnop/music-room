import { OpenAPIV3 } from 'openapi-types';

/**
 * OpenAPI paths for SoundCloud feature
 * Note: SoundCloud endpoints are PUBLIC (no authentication required)
 */
export const soundcloudPaths: OpenAPIV3.PathsObject = {
  '/api/soundcloud/search': {
    get: {
      tags: ['SoundCloud'],
      summary: 'Search SoundCloud tracks',
      description: 'Public endpoint - no authentication required. Returns list of tracks matching search query.',
      operationId: 'searchSoundCloudTracks',
      parameters: [
        {
          in: 'query',
          name: 'q',
          required: true,
          schema: { type: 'string', minLength: 1 },
          description: 'Search query',
          example: 'lofi hip hop'
        },
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
          description: 'Maximum number of results'
        },
        {
          in: 'query',
          name: 'offset',
          schema: { type: 'integer', minimum: 0, default: 0 },
          description: 'Pagination offset'
        }
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
                            items: { $ref: '#/components/schemas/SoundCloudTrack' }
                          },
                          count: { type: 'integer' }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '400': { $ref: '#/components/responses/ValidationError' }
      }
    }
  },

  '/api/soundcloud/track/{urlOrId}': {
    get: {
      tags: ['SoundCloud'],
      summary: 'Get SoundCloud track details',
      description: 'Public endpoint - no authentication required. Fetches track metadata by URL or ID.',
      operationId: 'getSoundCloudTrack',
      parameters: [
        {
          in: 'path',
          name: 'urlOrId',
          required: true,
          schema: { type: 'string' },
          description: 'SoundCloud track URL or ID',
          example: 'artist/track-name'
        }
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
                      data: { $ref: '#/components/schemas/SoundCloudTrack' }
                    }
                  }
                ]
              }
            }
          }
        },
        '404': { $ref: '#/components/responses/NotFoundError' }
      }
    }
  },

  '/api/soundcloud/stream/{trackUrl}': {
    get: {
      tags: ['SoundCloud'],
      summary: 'Get SoundCloud stream URL',
      description: 'Public endpoint - no authentication required. Returns AAC HLS stream URL for playback.',
      operationId: 'getSoundCloudStreamUrl',
      parameters: [
        {
          in: 'path',
          name: 'trackUrl',
          required: true,
          schema: { type: 'string' },
          description: 'URL-encoded SoundCloud track URL',
          example: 'https%3A%2F%2Fsoundcloud.com%2Fartist%2Ftrack'
        }
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
                            description: 'HLS AAC stream URL (expires after 30 minutes)'
                          }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '404': { $ref: '#/components/responses/NotFoundError' }
      }
    }
  }
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
        description: 'SoundCloud permalink URL'
      },
      albumArt: {
        type: 'string',
        format: 'uri',
        nullable: true,
        description: 'Artwork URL (large resolution)'
      },
      durationMs: {
        type: 'integer',
        description: 'Track duration in milliseconds'
      },
      playbackCount: {
        type: 'integer',
        description: 'Number of plays'
      },
      genre: {
        type: 'string',
        nullable: true
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Track upload date'
      }
    }
  }
};
