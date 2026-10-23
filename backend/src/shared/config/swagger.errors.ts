import type { OpenAPIRegistry, ResponseConfig } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// A doc-only date: `z.iso.datetime()` would print its whole regex in ErrorResponse.
const dateTime = z.string().meta({ format: 'date-time' });

const detailsSchema = z
	.union([
		z.array(
			z.object({
				path: z
					.string()
					.meta({ description: 'Dot-joined path of the invalid field', example: 'email' }),
				message: z.string().meta({ example: 'Invalid email' }),
			})
		),
		z.object({ retryAfter: dateTime }).meta({ description: 'RATE_LIMIT_EXCEEDED' }),
		z
			.object({ lockedUntil: dateTime, remainingTime: z.number().meta({ example: 900 }) })
			.meta({ description: 'ACCOUNT_LOCKED' }),
		z.unknown().meta({ description: 'Any JSON value (AppError details)' }),
	])
	.optional()
	.meta({
		description:
			'VALIDATION_ERROR: one entry per invalid field. RATE_LIMIT_EXCEEDED: `{ retryAfter }`, when the window ends. ACCOUNT_LOCKED: `{ lockedUntil, remainingTime }` (seconds). Other codes: free-form context, when present',
	});

const debugOnly = (what: string) =>
	z
		.string()
		.optional()
		.meta({ description: `${what}, for developers. Sent only in development and test` });

/** `{ success: false, error, meta }`. */
const errorResponseSchema = z.object({
	success: z.literal(false),
	error: z.object({
		message: z.string(),
		code: z.string(),
		details: detailsSchema,
		why: debugOnly('Technical reason'),
		fix: debugOnly('Hint to fix the error'),
	}),
	meta: z.object({ timestamp: dateTime }),
});

const ERROR_RESPONSE = { $ref: '#/components/schemas/ErrorResponse' };

type ErrorExample = [code: string, message: string, details?: unknown];

function errorExamples(examples: ErrorExample[]) {
	const values = examples.map(([code, message, details]) => ({
		success: false,
		error: { message, code, ...(details !== undefined && { details }) },
		meta: { timestamp: '2025-01-15T10:30:00.000Z' },
	}));
	if (values.length === 1) return { example: values[0] };
	if (values.length === 0) return {};
	return {
		examples: Object.fromEntries(values.map((value, i) => [`${value.error.code}_${i}`, { value }])),
	};
}

/** One example body per `[code, message, details?]`. */
export function fail(description: string, ...examples: ErrorExample[]): ResponseConfig {
	return {
		description,
		content: { 'application/json': { schema: ERROR_RESPONSE, ...errorExamples(examples) } },
	};
}

type SharedResponse =
	| 'UnauthorizedError'
	| 'ValidationError'
	| 'ForbiddenError'
	| 'NotFoundError'
	| 'RateLimitError'
	| 'RateLimitUnavailable';

const SHARED_RESPONSES: Record<SharedResponse, [description: string, ...ErrorExample[]]> = {
	UnauthorizedError: ['Authentication token missing or invalid', ['UNAUTHORIZED', 'Unauthorized']],
	ValidationError: [
		'Request validation failed',
		['VALIDATION_ERROR', 'Validation error', [{ path: 'email', message: 'Invalid email' }]],
	],
	ForbiddenError: ['Insufficient permissions'],
	NotFoundError: ['Resource not found'],
	RateLimitError: ['Too many requests'],
	RateLimitUnavailable: [
		'RATE_LIMIT_UNAVAILABLE: Redis is not ready, so the rate limiter cannot count the request (fails closed)',
		['RATE_LIMIT_UNAVAILABLE', 'Rate limiting is unavailable'],
	],
};

export function shared(name: SharedResponse) {
	return { $ref: `#/components/responses/${name}` };
}

export function registerErrorComponents(registry: OpenAPIRegistry): void {
	type SchemaComponent = Parameters<typeof registry.registerComponent<'schemas'>>[2];
	const errorResponse = z.toJSONSchema(errorResponseSchema, {
		target: 'openapi-3.0',
		io: 'input',
	});
	registry.registerComponent('schemas', 'ErrorResponse', errorResponse as SchemaComponent);
	for (const [name, [description, ...examples]] of Object.entries(SHARED_RESPONSES)) {
		registry.registerComponent('responses', name, {
			description,
			content: { 'application/json': { schema: ERROR_RESPONSE, ...errorExamples(examples) } },
		});
	}
}
