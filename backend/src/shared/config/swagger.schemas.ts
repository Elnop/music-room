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
					details: { type: 'object' },
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
						message: 'Validation failed',
						code: 'VALIDATION_ERROR',
						details: { field: 'email', issue: 'Invalid format' },
					},
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
};
