import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
	canResendResetCodeQuerySchema,
	canResendResultSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
} from '@/features/auth/auth.validators.js';
import { describeParams, jsonBody, ok, okMessage } from '@/shared/config/swagger.schemas.js';
import { fail, shared } from '@/shared/config/swagger.errors.js';

const redisDown = (counter: string) =>
	fail(
		`Redis is not ready. RATE_LIMIT_UNAVAILABLE: the route rate limiter cannot count the request. REDIS_UNAVAILABLE: the per-email ${counter} counter cannot be updated`
	);

/** Registers the password reset routes of /api/auth. */
export function registerAuthPasswordOpenapi(registry: OpenAPIRegistry): void {
	const tags = ['Authentication'];
	const invalidEmail = [
		'VALIDATION_ERROR',
		'Validation error',
		[{ path: 'email', message: 'Invalid email address' }],
	] as const;

	registry.registerPath({
		tags,
		method: 'post',
		path: '/api/auth/forgot-password',
		summary: 'Request a password reset code',
		description: `
        Sends a 6-digit reset code (valid 15 minutes) to the email.
        An account that signs in only with Google or Facebook gets a code too: resetting adds email/password sign-in to it.
        Each request starts the 60-second resend cooldown reported by GET /api/auth/reset-password/can-resend, even for an email with no account.
        The answer is the same whether the email belongs to an account or not, so it cannot be used to find accounts.

        **Rate limits:**
        - 20 requests per 15 minutes per IP (global auth limiter)
        - 3 requests per hour for the same email and IP
      `,
		operationId: 'forgotPassword',
		request: { body: jsonBody(forgotPasswordSchema) },
		responses: {
			200: okMessage(
				'Request accepted; a code was sent if the email belongs to an account',
				'If this email exists, a reset code has been sent.'
			),
			400: fail(
				'VALIDATION_ERROR: the email is invalid. The reset email could not be sent: the code is the mail transport error code (for example EAUTH, ECONNECTION)',
				[...invalidEmail]
			),
			429: fail(
				'RATE_LIMIT_EXCEEDED: the IP passed the global auth limiter, or this email and IP passed 3 requests per hour'
			),
			500: fail(
				'USER_FETCH_ERROR: Supabase Auth users could not be listed. PASSWORD_RESET_STORE_ERROR: the code could not be saved'
			),
			503: redisDown('request'),
		},
	});

	registry.registerPath({
		tags,
		method: 'post',
		path: '/api/auth/reset-password',
		summary: 'Reset the password with the emailed code',
		description: `
        Checks the code sent by POST /api/auth/forgot-password and sets the new password.
        For an account that had no password (Google or Facebook only), the new password becomes an additional sign-in method.
        The code is single use; the user then signs in with the login endpoint.

        **Password rules:** 8 to 100 characters, with at least one uppercase letter, one lowercase letter and one digit.

        **Rate limits:**
        - 20 requests per 15 minutes per IP (global auth limiter)
        - 5 attempts per 15 minutes for the same email and IP
      `,
		operationId: 'resetPassword',
		request: { body: jsonBody(resetPasswordSchema) },
		responses: {
			200: okMessage(
				'Password changed',
				'Password reset successful. You can now log in with your new password.'
			),
			400: fail(
				'VALIDATION_ERROR: invalid email, code not 6 digits, or password breaking the rules. INVALID_RESET_CODE: unknown email, no code stored, or the code does not match. RESET_CODE_EXPIRED: the code is older than 15 minutes; request a new one',
				[
					'VALIDATION_ERROR',
					'Validation error',
					[{ path: 'newPassword', message: 'Password must contain at least one uppercase letter' }],
				],
				['INVALID_RESET_CODE', 'Invalid reset code'],
				['RESET_CODE_EXPIRED', 'Reset code has expired']
			),
			429: fail(
				'RATE_LIMIT_EXCEEDED: the IP passed the global auth limiter, or this email and IP passed 5 attempts per 15 minutes'
			),
			500: fail(
				'USER_FETCH_ERROR: Supabase Auth users could not be listed. PASSWORD_UPDATE_ERROR: Supabase Auth refused the new password'
			),
			503: redisDown('attempt'),
		},
	});

	registry.registerPath({
		tags,
		method: 'get',
		path: '/api/auth/reset-password/can-resend',
		summary: 'Check whether a new reset code can be requested',
		description: `
        Reports the resend cooldown for this email and IP: \`canResend\` and the \`remainingSeconds\` before a new code can be requested.
        Reports whether a new POST /api/auth/forgot-password for this email and IP would be accepted. Each request starts a 60-second resend cooldown (advisory: the client waits for it), and at most 3 requests per hour are accepted; both count whether the email belongs to an account or not.
        When \`canResend\` is false, \`remainingSeconds\` is the real time left of whichever limit blocks the next request (up to an hour for the hourly limit).

        **Rate limit:** 20 requests per 15 minutes per IP (global auth limiter)
      `,
		operationId: 'canResendResetCode',
		request: {
			query: describeParams(canResendResetCodeQuerySchema, {
				email: 'Email the reset code was requested for',
			}),
		},
		responses: {
			200: ok('Cooldown state', canResendResultSchema),
			400: fail('VALIDATION_ERROR: the email query parameter is missing or not a valid email', [
				...invalidEmail,
			]),
			429: shared('RateLimitError'),
			503: shared('RateLimitUnavailable'),
		},
	});
}
