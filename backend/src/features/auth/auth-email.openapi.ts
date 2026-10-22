import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
	resendVerificationSchema,
	verifyEmailResultSchema,
	verifyEmailSchema,
} from '@/features/auth/auth.validators.js';
import { jsonBody, ok, okMessage } from '@/shared/config/swagger.schemas.js';
import { fail } from '@/shared/config/swagger.errors.js';

/** Registers the email verification routes of /api/auth. */
export function registerAuthEmailOpenapi(registry: OpenAPIRegistry): void {
	const tags = ['Authentication'];

	registry.registerPath({
		tags,
		method: 'post',
		path: '/api/auth/verify-email',
		summary: 'Verify email with the 6-digit code',
		description: `
        Checks the 6-digit code sent by email after registration, marks the email as verified and signs the user in.
        Answers with the same \`user\` and \`session\` as login, plus a \`message\`.

        **Rate limits:**
        - 5 failed requests per 15 minutes (login limiter; successful requests are not counted). The bucket is keyed on \`login:unknown:<ip>\` because the body has no email, so it is shared with POST /api/auth/refresh
        - EMAIL_VERIFICATION_MAX_ATTEMPTS checks per user and IP while the code is valid
      `,
		operationId: 'verifyEmail',
		request: {
			body: jsonBody(verifyEmailSchema, {
				userId: '3f1c2a9e-8b7d-4c6e-9a1f-2b3c4d5e6f70',
				code: '482915',
			}),
		},
		responses: {
			200: ok('Email verified; the user is signed in', verifyEmailResultSchema),
			400: fail(
				'VALIDATION_ERROR: userId is not a UUID or code is not 6 digits. NO_CODE_FOUND: no code is stored for this user; request a new one. CODE_EXPIRED: the code is past its lifetime; request a new one. INVALID_CODE: the code does not match. ALREADY_VERIFIED: the email is already verified; no session is issued, sign in instead',
				[
					'VALIDATION_ERROR',
					'Validation error',
					[{ path: 'code', message: 'Verification code must be 6 digits' }],
				],
				['NO_CODE_FOUND', 'No verification code found. Please request a new code.'],
				['CODE_EXPIRED', 'Verification code expired. Please request a new code.'],
				['INVALID_CODE', 'Invalid verification code'],
				['ALREADY_VERIFIED', 'Email already verified']
			),
			404: fail(
				'USER_NOT_FOUND: no profile for this userId. AUTH_USER_NOT_FOUND: the profile exists but Supabase Auth has no matching user',
				['USER_NOT_FOUND', 'User not found']
			),
			429: fail(
				'RATE_LIMIT_EXCEEDED: the IP passed 5 failed requests per 15 minutes on the login limiter bucket it shares with POST /api/auth/refresh, or this user and IP passed the verification attempt limit',
				['RATE_LIMIT_EXCEEDED', 'Too many login attempts. Please try again later.'],
				['RATE_LIMIT_EXCEEDED', 'Rate limit exceeded. Please try again in 15 minutes.']
			),
			500: fail(
				'VERIFICATION_ERROR: the code matched but the profile could not be marked as verified. SESSION_GENERATION_FAILED, INVALID_SESSION_RESPONSE, SESSION_CREATION_FAILED: the email is verified but no session could be created; the user can sign in with the login endpoint',
				['SESSION_CREATION_FAILED', 'Failed to create session']
			),
			503: fail(
				'Redis is not ready. RATE_LIMIT_UNAVAILABLE: the route rate limiter cannot count the request. REDIS_UNAVAILABLE: the verification attempt counter cannot be read'
			),
		},
	});

	registry.registerPath({
		tags,
		method: 'post',
		path: '/api/auth/resend-verification',
		summary: 'Send a new email verification code',
		description: `
        Generates a new 6-digit code for the user, replaces the previous one and sends it to the account's own email.
        A code is sent only when \`userId\` is an existing, not yet verified account and \`email\` matches its email (case-insensitive).
        Otherwise nothing is generated or sent, but the answer is the same 200 (and the same cooldown 429), so the endpoint does not reveal whether an account or an email exists.

        **Rate limits:**
        - 3 requests per hour per IP (register limiter, keyed on \`register:<ip>\`: the bucket is shared with POST /api/auth/register)
        - EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS between two codes for the same user and IP
        - EMAIL_VERIFICATION_MAX_RESENDS_PER_HOUR codes per hour for the same user and IP
      `,
		operationId: 'resendVerification',
		request: { body: jsonBody(resendVerificationSchema) },
		responses: {
			200: okMessage(
				'Request accepted: a code was sent to the account email if the account is unverified and the email matches (same answer otherwise)',
				'Verification code sent. Please check your email.'
			),
			400: fail(
				'VALIDATION_ERROR: userId is not a UUID or email is invalid. The verification email could not be sent: the code is the mail transport error code (for example EAUTH, ECONNECTION)'
			),
			429: fail(
				'RESEND_COOLDOWN: a code was sent too recently; the message gives the seconds left. RESEND_LIMIT_EXCEEDED: the hourly resend limit for this user and IP is reached. RATE_LIMIT_EXCEEDED: the IP passed the register limiter, whose bucket is shared with POST /api/auth/register',
				['RESEND_COOLDOWN', 'Please wait 42 seconds before requesting a new code'],
				['RESEND_LIMIT_EXCEEDED', 'Too many resend attempts. Please try again later.'],
				['RATE_LIMIT_EXCEEDED', 'Too many registration attempts. Please try again later.']
			),
			500: fail('CODE_STORE_ERROR: the new code could not be saved'),
			503: fail(
				'Redis is not ready. RATE_LIMIT_UNAVAILABLE: the route rate limiter cannot count the request. REDIS_UNAVAILABLE: the resend cooldown cannot be checked'
			),
		},
	});
}
