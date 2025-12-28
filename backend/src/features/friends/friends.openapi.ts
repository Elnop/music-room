import { OpenAPIV3 } from 'openapi-types';

/**
 * OpenAPI paths pour feature Friends
 */
export const friendsPaths: OpenAPIV3.PathsObject = {
  '/api/friends': {
    get: {
      tags: ['Friends'],
      summary: 'Get user friends list',
      description: 'Returns list of users that the authenticated user follows (mutual or one-way follows)',
      operationId: 'getFriends',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Friends list retrieved',
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
                          friends: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Friend' }
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

  '/api/friends/stats/me': {
    get: {
      tags: ['Friends'],
      summary: 'Get user friend statistics',
      description: 'Returns follower and following counts for authenticated user',
      operationId: 'getFriendStats',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Stats retrieved',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/FriendStats' }
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

  '/api/friends/status/{userId}': {
    get: {
      tags: ['Friends'],
      summary: 'Check follow status with a user',
      description: 'Returns whether authenticated user follows target user and vice versa',
      operationId: 'checkFollowStatus',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'User ID to check follow status with'
        }
      ],
      responses: {
        '200': {
          description: 'Follow status retrieved',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/FollowStatus' }
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

  '/api/friends/follow/{userId}': {
    post: {
      tags: ['Friends'],
      summary: 'Follow a user',
      description: 'Start following another user. Creates one-way follow relationship.',
      operationId: 'followUser',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'User ID to follow'
        }
      ],
      responses: {
        '200': {
          description: 'User followed successfully',
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
                          message: { type: 'string', example: 'User followed successfully' },
                          followStatus: { $ref: '#/components/schemas/FollowStatus' }
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
          description: 'Cannot follow yourself',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '401': { $ref: '#/components/responses/UnauthorizedError' },
        '404': { $ref: '#/components/responses/NotFoundError' },
        '409': {
          description: 'Already following user',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Friends'],
      summary: 'Unfollow a user',
      description: 'Stop following a user. Removes follow relationship.',
      operationId: 'unfollowUser',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'User ID to unfollow'
        }
      ],
      responses: {
        '200': {
          description: 'User unfollowed successfully',
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
                          message: { type: 'string', example: 'User unfollowed successfully' }
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
 * Schemas spécifiques aux Friends
 */
export const friendsSchemas: OpenAPIV3.ComponentsObject['schemas'] = {
  Friend: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      username: { type: 'string' },
      displayName: { type: 'string', nullable: true },
      avatarUrl: { type: 'string', format: 'uri', nullable: true },
      followedAt: { type: 'string', format: 'date-time' },
      isMutual: { type: 'boolean', description: 'True if both users follow each other' },
      canControlMusic: {
        type: 'boolean',
        description: 'True if this friend can control your music playback'
      }
    }
  },

  FriendStats: {
    type: 'object',
    properties: {
      following: { type: 'integer', description: 'Number of users you follow' },
      followers: { type: 'integer', description: 'Number of users following you' },
      mutualFriends: { type: 'integer', description: 'Number of mutual follows' }
    }
  },

  FollowStatus: {
    type: 'object',
    properties: {
      isFollowing: {
        type: 'boolean',
        description: 'True if authenticated user follows the target user'
      },
      isFollowedBy: {
        type: 'boolean',
        description: 'True if target user follows the authenticated user'
      },
      isMutual: {
        type: 'boolean',
        description: 'True if both users follow each other'
      }
    }
  }
};
