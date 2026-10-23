import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
	authResultSchema,
	facebookLoginSchema,
	googleLoginSchema,
	linkedProvidersSchema,
	providerParamSchema,
} from '@/features/auth/auth.validators.js';
import {
	bearerAuth,
	describeParams,
	jsonBody,
	ok,
	okMessage,
} from '@/shared/config/swagger.schemas.js';
import { fail, shared } from '@/shared/config/swagger.errors.js';

export function registerAuthOauthOpenapi(registry: OpenAPIRegistry): void {
	const tags = ['Authentication', 'OAuth'];
	const signIn = {
		200: ok('Login successful; a new account is created on first sign-in', authResultSchema),
		401: shared('UnauthorizedError'),
		429: shared('RateLimitError'),
		503: shared('RateLimitUnavailable'),
	};
	const signedIn = { 401: shared('UnauthorizedError'), 503: shared('RateLimitUnavailable') };

	registry.registerPath({
		tags,
		method: 'post',
		path: '/api/auth/google',
		summary: 'Login with Google account',
		description: `
        Authenticate using Google ID token (OAuth 2.0).

        **Flow:**
        1. Client obtains Google ID token via Google Sign-In SDK
        2. Send ID token to this endpoint
        3. Backend verifies with Google APIs
        4. Returns Zumik session tokens

        **Behavior:**
        - Existing user → Login
        - New user → Create account and login
        - Email required (Google provides verified email)

        **Rate limit:** 10 requests per 15 minutes per IP
      `,
		operationId: 'googleLogin',
		request: { body: jsonBody(googleLoginSchema) },
		responses: signIn,
	});

	registry.registerPath({
		tags,
		method: 'post',
		path: '/api/auth/facebook',
		summary: 'Login with Facebook account',
		description: `
        Authenticate using Facebook access token (OAuth 2.0).

        **Email handling:**
        - If Facebook provides email → Use real email
        - No email permission → Generate synthetic (facebook_{id}@zumik.local)
        - User can add real email later in profile

        **Rate limit:** 10 requests per 15 minutes per IP
      `,
		operationId: 'facebookLogin',
		request: { body: jsonBody(facebookLoginSchema) },
		responses: signIn,
	});

	registry.registerPath({
		tags,
		method: 'get',
		path: '/api/auth/providers',
		summary: 'Get linked OAuth providers',
		description: 'Returns list of providers linked to current user account',
		operationId: 'getLinkedProviders',
		security: bearerAuth,
		responses: { 200: ok('Providers retrieved', linkedProvidersSchema), ...signedIn },
	});

	registry.registerPath({
		tags,
		method: 'delete',
		path: '/api/auth/providers/{provider}',
		summary: 'Unlink OAuth provider',
		description: `
        Removes link between user and OAuth provider.

        **Safety:** Cannot unlink last authentication method.
      `,
		operationId: 'unlinkProvider',
		security: bearerAuth,
		request: {
			params: describeParams(providerParamSchema, { provider: 'OAuth provider to unlink' }),
		},
		responses: {
			200: okMessage('Provider unlinked', 'google unlinked successfully'),
			400: fail('Cannot unlink last authentication method'),
			404: shared('NotFoundError'),
			...signedIn,
		},
	});

	registry.registerPath({
		tags,
		method: 'post',
		path: '/api/auth/providers/{provider}/link',
		summary: 'Link OAuth provider to current account',
		description: `
        Links a Google or Facebook account to the signed-in user, whatever the email of the social account.
        Afterwards the user can sign in with any linked method and reach the same account.

        **Body:** the token the app already gets for sign-in. The \`provider\` path value decides which field is required:
        - google → \`{ idToken }\` (same as POST /api/auth/google)
        - facebook → \`{ accessToken }\` (same as POST /api/auth/facebook)

        **Errors:**
        - \`INVALID_PROVIDER_TOKEN\` (400): the provider token is invalid or expired. Not a 401, so the client does not take it for an expired session
        - \`PROVIDER_ALREADY_LINKED\` (409): this social account is linked to another user
        - \`PROVIDER_ALREADY_SET\` (409): the current user already has an account of this provider linked, this one or another
      `,
		operationId: 'linkProvider',
		security: bearerAuth,
		request: {
			params: describeParams(providerParamSchema, { provider: 'OAuth provider to link' }),
			body: jsonBody(z.union([googleLoginSchema, facebookLoginSchema])),
		},
		responses: {
			200: ok('Provider linked; returns every linked provider', linkedProvidersSchema),
			400: fail('VALIDATION_ERROR, or INVALID_PROVIDER_TOKEN: invalid provider token', [
				'INVALID_PROVIDER_TOKEN',
				'Invalid or expired Google token',
			]),
			409: fail(
				'Social account already linked to another user, or this provider already linked to the current user',
				['PROVIDER_ALREADY_LINKED', 'This Google account is already linked to another user'],
				['PROVIDER_ALREADY_SET', 'A Google account is already linked to this user']
			),
			429: shared('RateLimitError'),
			...signedIn,
		},
	});
}
