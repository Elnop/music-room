import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { registerAuthEmailOpenapi } from '@/features/auth/auth-email.openapi.js';
import { registerAuthOauthOpenapi } from '@/features/auth/auth-oauth.openapi.js';
import { registerAuthPasswordOpenapi } from '@/features/auth/auth-password.openapi.js';
import { registerAuthSessionOpenapi } from '@/features/auth/auth-session.openapi.js';
import {
	authResultSchema,
	canResendResultSchema,
	facebookLoginSchema,
	forgotPasswordSchema,
	googleLoginSchema,
	linkedProviderSchema,
	loginSchema,
	refreshTokenSchema,
	registerSchema,
	resendVerificationSchema,
	resetPasswordSchema,
	userProfileSchema,
	verifyEmailResultSchema,
	verifyEmailSchema,
} from '@/features/auth/auth.validators.js';
import { jsonBody, nameSchemas, ok } from '@/shared/config/swagger.schemas.js';
import { fail, shared } from '@/shared/config/swagger.errors.js';

export function registerAuthOpenapi(registry: OpenAPIRegistry): void {
	const tags = ['Authentication'];
	const unavailable = shared('RateLimitUnavailable');
	nameSchemas({
		UserProfile: userProfileSchema,
		AuthResponse: authResultSchema,
		VerifyEmailResponse: verifyEmailResultSchema,
		LinkedProvider: linkedProviderSchema,
		CanResendResetCodeResponse: canResendResultSchema,
		RegisterRequest: registerSchema,
		LoginRequest: loginSchema,
		RefreshTokenRequest: refreshTokenSchema,
		GoogleLoginRequest: googleLoginSchema,
		FacebookLoginRequest: facebookLoginSchema,
		VerifyEmailRequest: verifyEmailSchema,
		ResendVerificationRequest: resendVerificationSchema,
		ForgotPasswordRequest: forgotPasswordSchema,
		ResetPasswordRequest: resetPasswordSchema,
	});

	registry.registerPath({
		tags,
		method: 'post',
		path: '/api/auth/register',
		summary: 'Register new user with email/password',
		description: `
        Creates new user account.

        **Validation rules:**
        - Email must be valid and unique
        - Password minimum 8 characters with uppercase, lowercase, and number
        - Username 3-20 characters, alphanumeric and underscores only
        - Display name optional, max 50 characters

        **Email verification:** with \`EMAIL_VERIFICATION_ENABLED=true\` (default) the
        account waits for the emailed code (\`requiresVerification: true\`, no session); if the
        email cannot be sent, the account is removed and the call answers 503 EMAIL_UNAVAILABLE.
        With \`EMAIL_VERIFICATION_ENABLED=false\` the account is created verified and signed in
        (\`requiresVerification: false\` and a session).

        **Rate limit:** 3 requests per hour per IP
      `,
		operationId: 'registerUser',
		request: { body: jsonBody(registerSchema) },
		responses: {
			201: ok('User registered successfully', authResultSchema),
			400: shared('ValidationError'),
			409: fail('Email or username already exists', ['CONFLICT', 'Email already registered']),
			429: shared('RateLimitError'),
			503: fail(
				'EMAIL_UNAVAILABLE: the verification email could not be sent, the account was not kept; or RATE_LIMIT_UNAVAILABLE: Redis is not ready',
				['EMAIL_UNAVAILABLE', 'Could not send the verification email, please try again later']
			),
		},
	});

	registry.registerPath({
		tags,
		method: 'post',
		path: '/api/auth/login',
		summary: 'Login with email and password',
		description: `
        Authenticate user and receive JWT tokens.

        **Security:**
        - Account locked after 5 failed attempts (15min lockout)
        - Rate limited: 5 attempts per 15 minutes per IP
        - IP blacklist for persistent abuse

        **Response includes:**
        - Access token (expires in 1 hour)
        - Refresh token (expires in 7 days)
      `,
		operationId: 'loginUser',
		request: { body: jsonBody(loginSchema) },
		responses: {
			200: ok('Login successful', authResultSchema),
			401: fail('Invalid email or password'),
			429: fail(
				'RATE_LIMIT_EXCEEDED: too many failed attempts for this email from this IP within the limiter window (checked first; the usual answer to repeated failures). ACCOUNT_LOCKED: the email is locked for this IP and the limiter window has ended (longer escalated locks)',
				[
					'RATE_LIMIT_EXCEEDED',
					'Too many login attempts. Please try again later.',
					{ retryAfter: '2025-01-15T11:00:00.000Z' },
				],
				[
					'ACCOUNT_LOCKED',
					'Account temporarily locked due to too many failed login attempts. Please try again later.',
					{ lockedUntil: '2025-01-15T11:00:00.000Z', remainingTime: 900 },
				]
			),
			503: unavailable,
		},
	});

	registerAuthSessionOpenapi(registry);
	registerAuthOauthOpenapi(registry);
	registerAuthEmailOpenapi(registry);
	registerAuthPasswordOpenapi(registry);
}
