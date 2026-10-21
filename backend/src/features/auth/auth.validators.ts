import { z } from 'zod';
import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from '@/features/auth/utils/username.js';

/**
 * Validation schemas using Zod
 */

export const registerSchema = z.object({
	email: z.email('Invalid email address'),
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.max(100, 'Password is too long')
		.regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
		.regex(/[a-z]/, 'Password must contain at least one lowercase letter')
		.regex(/[0-9]/, 'Password must contain at least one number'),
	username: z
		.string()
		.min(USERNAME_MIN_LENGTH, `Username must be at least ${USERNAME_MIN_LENGTH} characters`)
		.max(USERNAME_MAX_LENGTH, `Username must be at most ${USERNAME_MAX_LENGTH} characters`)
		.regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
	displayName: z.string().max(50, 'Display name is too long').optional(),
});

export const loginSchema = z.object({
	email: z.email('Invalid email address'),
	password: z.string().min(1, 'Password is required'),
});

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
	provider: z.enum(['google', 'facebook']),
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
		.regex(/[0-9]/, 'Password must contain at least one digit'),
});
