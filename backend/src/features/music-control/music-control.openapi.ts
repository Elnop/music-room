import { OpenAPIV3 } from 'openapi-types';

/**
 * OpenAPI paths for Music Control Delegation feature
 */
export const musicControlPaths: OpenAPIV3.PathsObject = {
  '/api/music-control/permissions': {
    get: {
      tags: ['Music Control'],
      summary: 'Get users who granted you music control',
      description: 'Returns list of friends who have delegated music control permissions to you',
      operationId: 'getMusicControlPermissions',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Permissions retrieved',
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
                          permissions: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/MusicControlPermission' }
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
        '401': { $ref: '#/components/responses/UnauthorizedError' }
      }
    }
  },

  '/api/music-control/permissions/{userId}': {
    post: {
      tags: ['Music Control'],
      summary: 'Grant music control to a friend',
      description: 'Allows a friend to control your music playback (play, pause, skip, change tracks)',
      operationId: 'grantMusicControl',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Friend user ID to grant control to'
        }
      ],
      responses: {
        '200': {
          description: 'Music control granted',
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
                          message: { type: 'string', example: 'Music control granted successfully' }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '400': {
          description: 'Cannot grant control (not following or other validation error)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '401': { $ref: '#/components/responses/UnauthorizedError' },
        '404': { $ref: '#/components/responses/NotFoundError' }
      }
    },
    delete: {
      tags: ['Music Control'],
      summary: 'Revoke music control from a friend',
      description: 'Removes music control permissions from a friend',
      operationId: 'revokeMusicControl',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Friend user ID to revoke control from'
        }
      ],
      responses: {
        '200': {
          description: 'Music control revoked',
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
                          message: { type: 'string', example: 'Music control revoked successfully' }
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
        '404': { $ref: '#/components/responses/NotFoundError' }
      }
    }
  },

  '/api/music-control/can-control/{userId}': {
    get: {
      tags: ['Music Control'],
      summary: "Check if you can control a user's music",
      description: 'Returns whether authenticated user has permission to control target user music playback',
      operationId: 'canControlUserMusic',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'User ID to check control permission for'
        }
      ],
      responses: {
        '200': {
          description: 'Control status retrieved',
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
                          canControl: {
                            type: 'boolean',
                            description: 'True if you can control this user music'
                          },
                          userId: { type: 'string', format: 'uuid' }
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
        '404': { $ref: '#/components/responses/NotFoundError' }
      }
    }
  }
};

/**
 * Schemas specific to Music Control
 */
export const musicControlSchemas: OpenAPIV3.ComponentsObject['schemas'] = {
  MusicControlPermission: {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          username: { type: 'string' },
          displayName: { type: 'string', nullable: true },
          avatarUrl: { type: 'string', format: 'uri', nullable: true }
        }
      },
      grantedAt: { type: 'string', format: 'date-time' },
      canControl: {
        type: 'boolean',
        description: 'True if you can control this user music playback'
      }
    }
  }
};
