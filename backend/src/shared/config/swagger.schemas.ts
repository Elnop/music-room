import { OpenAPIV3 } from 'openapi-types';

/**
 * Common reusable OpenAPI schemas
 * Referenced via $ref in all features
 */
export const commonSchemas: OpenAPIV3.ComponentsObject['schemas'] = {
	// Responses standards
	SuccessResponse: {
		type: 'object',
		required: ['success', 'data', 'meta'],
		properties: {
			success: { type: 'boolean', example: true },
			data: { type: 'object', description: 'Response payload' },
			meta: {
				type: 'object',
				properties: {
					timestamp: { type: 'string', format: 'date-time' },
					requestId: { type: 'string', format: 'uuid' },
				},
			},
		},
	},

	ErrorResponse: {
		type: 'object',
		required: ['success', 'error', 'meta'],
		properties: {
			success: { type: 'boolean', example: false },
			error: {
				type: 'object',
				required: ['message', 'code'],
				properties: {
					message: { type: 'string' },
					code: { type: 'string' },
					details: {
						description:
							'VALIDATION_ERROR: one entry per invalid field. RATE_LIMIT_EXCEEDED: `{ retryAfter }`, when the window ends. ACCOUNT_LOCKED: `{ lockedUntil, remainingTime }` (seconds). Other codes: free-form context, when present',
						anyOf: [
							{
								type: 'array',
								items: {
									type: 'object',
									required: ['path', 'message'],
									properties: {
										path: {
											type: 'string',
											description: 'Dot-joined path of the invalid field',
											example: 'email',
										},
										message: { type: 'string', example: 'Invalid email' },
									},
								},
							},
							{
								type: 'object',
								description: 'RATE_LIMIT_EXCEEDED',
								properties: { retryAfter: { type: 'string', format: 'date-time' } },
							},
							{
								type: 'object',
								description: 'ACCOUNT_LOCKED',
								properties: {
									lockedUntil: { type: 'string', format: 'date-time' },
									remainingTime: { type: 'integer', example: 900 },
								},
							},
							{ description: 'Any JSON value (AppError details)' },
						],
					},
					why: {
						type: 'string',
						description: 'Technical reason, for developers. Sent only in development and test',
					},
					fix: {
						type: 'string',
						description: 'Hint to fix the error, for developers. Sent only in development and test',
					},
				},
			},
			meta: {
				type: 'object',
				properties: {
					timestamp: { type: 'string', format: 'date-time' },
				},
			},
		},
	},
};

export const commonResponses: OpenAPIV3.ComponentsObject['responses'] = {
	UnauthorizedError: {
		description: 'Authentication token missing or invalid',
		content: {
			'application/json': {
				schema: { $ref: '#/components/schemas/ErrorResponse' },
				example: {
					success: false,
					error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
					meta: { timestamp: '2025-01-15T10:30:00.000Z' },
				},
			},
		},
	},

	ValidationError: {
		description: 'Request validation failed',
		content: {
			'application/json': {
				schema: { $ref: '#/components/schemas/ErrorResponse' },
				example: {
					success: false,
					error: {
						message: 'Validation error',
						code: 'VALIDATION_ERROR',
						details: [{ path: 'email', message: 'Invalid email' }],
					},
					meta: { timestamp: '2025-01-15T10:30:00.000Z' },
				},
			},
		},
	},

	ForbiddenError: {
		description: 'Insufficient permissions',
		content: {
			'application/json': {
				schema: { $ref: '#/components/schemas/ErrorResponse' },
			},
		},
	},

	NotFoundError: {
		description: 'Resource not found',
		content: {
			'application/json': {
				schema: { $ref: '#/components/schemas/ErrorResponse' },
			},
		},
	},

	RateLimitError: {
		description: 'Too many requests',
		content: {
			'application/json': {
				schema: { $ref: '#/components/schemas/ErrorResponse' },
			},
		},
	},

	RateLimitUnavailable: {
		description:
			'RATE_LIMIT_UNAVAILABLE: Redis is not ready, so the rate limiter cannot count the request (fails closed)',
		content: {
			'application/json': {
				schema: { $ref: '#/components/schemas/ErrorResponse' },
				example: {
					success: false,
					error: {
						message: 'Rate limiting is unavailable',
						code: 'RATE_LIMIT_UNAVAILABLE',
					},
				},
			},
		},
	},
};
