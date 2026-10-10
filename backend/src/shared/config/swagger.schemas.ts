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
							'VALIDATION_ERROR: one entry per invalid field. Other codes: free-form context, when present',
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
							{ description: 'Any JSON value (AppError details)' },
						],
					},
					retryAfter: {
						type: 'string',
						format: 'date-time',
						description: 'RATE_LIMIT_EXCEEDED only: when the rate-limit window ends',
					},
					lockedUntil: {
						type: 'string',
						format: 'date-time',
						description: 'ACCOUNT_LOCKED only: when the lockout ends',
					},
					remainingTime: {
						type: 'integer',
						description: 'ACCOUNT_LOCKED only: seconds until the lockout ends',
						example: 900,
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
