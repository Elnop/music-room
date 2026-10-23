import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
	authResultSchema,
	currentUserSchema,
	refreshTokenSchema,
} from '@/features/auth/auth.validators.js';
import { bearerAuth, jsonBody, ok, okMessage } from '@/shared/config/swagger.schemas.js';
import { fail, shared } from '@/shared/config/swagger.errors.js';

export function registerAuthSessionOpenapi(registry: OpenAPIRegistry): void {
	const tags = ['Authentication'];
	const unavailable = shared('RateLimitUnavailable');

	registry.registerPath({
		tags,
		method: 'post',
		path: '/api/auth/refresh',
		summary: 'Refresh access token',
		description: 'Exchange refresh token for new access token when expired (after 1h)',
		operationId: 'refreshToken',
		request: { body: jsonBody(refreshTokenSchema) },
		responses: {
			200: ok('New access token generated', authResultSchema),
			401: fail(
				'INVALID_REFRESH_TOKEN: Supabase Auth refused the refresh token (revoked, expired, already used or unknown). The client must sign in again.',
				['INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token']
			),
			429: shared('RateLimitError'),
			503: fail(
				'AUTH_UNAVAILABLE: Supabase Auth is unreachable or failing, so the token was neither accepted nor refused; the client keeps its session and retries later. RATE_LIMIT_UNAVAILABLE: Redis is not ready, so the rate limiter cannot count the request (fails closed).',
				['AUTH_UNAVAILABLE', 'Authentication service is unavailable'],
				['RATE_LIMIT_UNAVAILABLE', 'Rate limiting is unavailable']
			),
		},
	});

	registry.registerPath({
		tags,
		method: 'get',
		path: '/api/auth/me',
		summary: 'Get current authenticated user profile',
		operationId: 'getCurrentUser',
		security: bearerAuth,
		responses: {
			200: ok('User profile retrieved', currentUserSchema),
			401: shared('UnauthorizedError'),
			503: unavailable,
		},
	});

	registry.registerPath({
		tags,
		method: 'post',
		path: '/api/auth/logout',
		summary: 'Logout current user',
		description:
			"Ends the session the bearer token belongs to. The access token goes to a Redis denylist until it expires, so every authenticated route then answers 401 TOKEN_REVOKED for it. The Supabase session is revoked (scope local), so its refresh token can no longer mint tokens; the user's other sessions stay signed in.",
		operationId: 'logoutUser',
		security: bearerAuth,
		responses: {
			200: okMessage('Logout successful', 'Logged out successfully'),
			401: shared('UnauthorizedError'),
			500: fail(
				'LOGOUT_FAILED: the access token was revoked, but the Supabase session could not be ended; the refresh token may still work'
			),
			503: fail(
				'Redis is not ready. REVOCATION_UNAVAILABLE: the token cannot be revoked or checked. RATE_LIMIT_UNAVAILABLE: the global auth rate limiter cannot count the request'
			),
		},
	});
}
