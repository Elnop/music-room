import { z } from 'zod';
import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from '@/features/auth/utils/username.js';

export const registerSchema = z.object({
	email: z.email('Invalid email address'),
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.max(100, 'Password is too long')
		.regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
		.regex(/[a-z]/, 'Password must contain at least one lowercase letter')
		.regex(/[0-9]/, 'Password must contain at least one number')
		.meta({ format: 'password' }),
	username: z
		.string()
		.min(USERNAME_MIN_LENGTH, `Username must be at least ${USERNAME_MIN_LENGTH} characters`)
		.max(USERNAME_MAX_LENGTH, `Username must be at most ${USERNAME_MAX_LENGTH} characters`)
		.regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
	displayName: z.string().max(50, 'Display name is too long').optional(),
});

export const loginSchema = z.object({
	email: z.email('Invalid email address'),
	password: z.string().min(1, 'Password is required').meta({ format: 'password' }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
	refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const googleLoginSchema = z.object({
	idToken: z.string().min(1, 'ID token is required'),
});

export const facebookLoginSchema = z.object({
	accessToken: z.string().min(1, 'Access token is required'),
});

export const providerParamSchema = z.object({
	provider: z.enum(['google', 'facebook']).meta({ param: { description: 'OAuth provider' } }),
});

export const verifyEmailSchema = z.object({
	userId: z.uuid('Invalid user ID'),
	code: z
		.string()
		.length(6, 'Verification code must be 6 digits')
		.regex(/^\d{6}$/, 'Verification code must contain only digits'),
});

export const resendVerificationSchema = z.object({
	userId: z.uuid('Invalid user ID'),
	email: z.email('Invalid email address'),
});

export const forgotPasswordSchema = z.object({
	email: z.email('Invalid email address'),
});

export const canResendResetCodeQuerySchema = z.object({
	email: z.email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
	email: z.email('Invalid email address'),
	code: z
		.string()
		.length(6, 'Reset code must be 6 digits')
		.regex(/^\d{6}$/, 'Reset code must contain only digits'),
	newPassword: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.max(100, 'Password is too long')
		.regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
		.regex(/[a-z]/, 'Password must contain at least one lowercase letter')
		.regex(/[0-9]/, 'Password must contain at least one digit')
		.meta({ format: 'password' }),
});

// Response bodies, for the OpenAPI document; auth.types.ts infers its response types from them.

export const userProfileSchema = z.object({
	id: z.uuid(),
	email: z.email(),
	username: z.string(),
	displayName: z.string().optional(),
	avatarUrl: z.url().optional(),
	bio: z.string().optional(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

const sessionSchema = z.object({
	accessToken: z.string().meta({ description: 'JWT access token (expires in 1 hour)' }),
	refreshToken: z.string().meta({ description: 'Refresh token (expires in 7 days)' }),
	expiresIn: z.int().meta({ description: 'Token lifetime in seconds', example: 3600 }),
	expiresAt: z
		.int()
		.meta({ description: 'Unix timestamp when token expires', example: 1705318200 }),
});

/** Sign-in answer; register with email verification on gives no session. */
export const authResultSchema = z.object({
	user: userProfileSchema,
	session: sessionSchema.optional(),
	requiresVerification: z.boolean().optional().meta({
		description: 'True after register when the account waits for the emailed code (no session)',
	}),
	message: z.string().optional(),
});

export const verifyEmailResultSchema = z.object({
	user: userProfileSchema,
	session: sessionSchema,
	message: z.string().meta({ example: 'Email verified successfully' }),
});

export const currentUserSchema = z.object({ user: userProfileSchema });

export const linkedProviderSchema = z.object({
	type: z.enum(['password', 'google', 'facebook']),
	connectedAt: z.iso.datetime(),
	isPrimary: z.boolean(),
});

export const linkedProvidersSchema = z.object({ providers: z.array(linkedProviderSchema) });

export const canResendResultSchema = z.object({
	canResend: z.boolean(),
	remainingSeconds: z.int().min(0).meta({
		description:
			'Seconds before a new forgot-password request is accepted (resend cooldown or hourly limit); 0 when canResend is true',
	}),
});
