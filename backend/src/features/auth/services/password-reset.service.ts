/**
 * Password Reset Service
 *
 * ESLint overrides:
 * - no-unsafe-* rules are disabled for this file due to external library limitations:
 *   1. Supabase Admin API (auth.admin.*) returns untyped responses
 *   2. Logger and crypto are properly typed but ESLint cannot infer correctly
 *   3. All business logic uses proper TypeScript types (UserProfileUpdate, etc.)
 *
 * Type safety is maintained through:
 * - Explicit type annotations on all public methods
 * - Use of generated Supabase types (UserProfileRow, UserProfileUpdate)
 * - Proper error handling with typed AppError
 */

import crypto from 'crypto';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { sendPasswordResetEmail } from '@/features/mail/mail.service.js';
import { RateLimiterService } from '@/shared/services/rate-limiter.service.js';
import { PasswordResetCooldownService } from '@/features/auth/services/password-reset-cooldown.service.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type {
	UserProfileRow,
	UserProfileUpdate,
	SupabaseAdminUsersResponse,
} from '@/features/auth/auth.types.js';

export class PasswordResetService {
	private rateLimiter: RateLimiterService;
	private cooldown = new PasswordResetCooldownService();

	// Configuration (similar to email verification)
	private readonly CODE_LENGTH = 6;
	private readonly CODE_EXPIRY_MINUTES = 15;
	private readonly MAX_RESET_ATTEMPTS = 5;

	constructor() {
		this.rateLimiter = new RateLimiterService();
	}

	generateResetCode(): string {
		const code = crypto.randomInt(100000, 999999).toString();
		return code;
	}

	async storeResetCode(userId: string, code: string): Promise<void> {
		const expiresAt = new Date();
		expiresAt.setMinutes(expiresAt.getMinutes() + this.CODE_EXPIRY_MINUTES);

		const updateData: UserProfileUpdate = {
			password_reset_code: code,
			password_reset_code_expires_at: expiresAt.toISOString(),
		};

		const { error } = await supabaseAdmin.from('user_profiles').update(updateData).eq('id', userId);

		if (error) {
			logger.error('Failed to store reset code', { userId, error: error.message });
			throw new AppError(500, 'Failed to store reset code', 'PASSWORD_RESET_STORE_ERROR');
		}

		logger.info('Password reset code stored', { userId, expiresAt });
	}

	async requestPasswordReset(email: string, ip: string): Promise<void> {
		// Hourly limit and resend cooldown, whether the email exists or not (#187).
		await this.cooldown.consumeRequest(email, ip);

		const { data: authUserResponse, error: authError } = await supabaseAdmin.auth.admin.listUsers();

		if (authError) {
			logger.error('Failed to list users for password reset', {
				error: authError.message,
			});
			throw new AppError(500, 'Failed to retrieve user', 'USER_FETCH_ERROR');
		}

		const authUser = authUserResponse as SupabaseAdminUsersResponse;
		const user = authUser.users.find(u => u.email === email);

		if (!user) {
			logger.warn('Password reset requested for non-existent email', {
				email,
				ip,
			});
			return;
		}

		const { data: profile, error: profileError } = await supabaseAdmin
			.from('user_profiles')
			.select('google_id, facebook_id')
			.eq('id', user.id)
			.single();

		if (profileError) {
			logger.error('Failed to fetch user profile', {
				userId: user.id,
				error: profileError.message,
			});
			throw new AppError(500, 'Failed to fetch user profile', 'PROFILE_FETCH_ERROR');
		}

		const typedProfile = profile as UserProfileRow | null;

		if (
			typedProfile &&
			!user.email?.includes('@') &&
			(typedProfile.google_id || typedProfile.facebook_id)
		) {
			throw new AppError(
				400,
				'This account uses social login. Please sign in with Google or Facebook.',
				'OAUTH_ONLY_ACCOUNT'
			);
		}

		const code = this.generateResetCode();
		await this.storeResetCode(user.id, code);

		await sendPasswordResetEmail(email, code, this.CODE_EXPIRY_MINUTES);

		logger.info('Password reset email sent', { email, userId: user.id });
	}

	async resetPassword(email: string, code: string, newPassword: string, ip: string): Promise<void> {
		const attemptsKey = `password_reset_attempts:${email}:${ip}`;
		await this.rateLimiter.incrementAndCheck(attemptsKey, {
			maxAttempts: this.MAX_RESET_ATTEMPTS,
			windowSeconds: 15 * 60,
		});

		const { data: authUserResponse, error: authError } = await supabaseAdmin.auth.admin.listUsers();

		if (authError) {
			logger.error('Failed to list users for password reset', {
				error: authError.message,
			});
			throw new AppError(500, 'Failed to retrieve user', 'USER_FETCH_ERROR');
		}

		const authUser = authUserResponse as SupabaseAdminUsersResponse;
		const user = authUser.users.find(u => u.email === email);

		if (!user) {
			throw new AppError(400, 'Invalid reset code', 'INVALID_RESET_CODE');
		}

		const { data: profile, error: profileError } = await supabaseAdmin
			.from('user_profiles')
			.select('password_reset_code, password_reset_code_expires_at')
			.eq('id', user.id)
			.single();

		if (profileError || !profile) {
			throw new AppError(400, 'Invalid or expired reset code', 'INVALID_RESET_CODE');
		}

		const resetCode = profile.password_reset_code;
		const expiresAt = profile.password_reset_code_expires_at;

		if (!resetCode) {
			throw new AppError(400, 'Invalid or expired reset code', 'INVALID_RESET_CODE');
		}

		const expirationDate = new Date(expiresAt as string);
		if (expirationDate < new Date()) {
			throw new AppError(400, 'Reset code has expired', 'RESET_CODE_EXPIRED');
		}

		const isValid = crypto.timingSafeEqual(Buffer.from(resetCode), Buffer.from(code));

		if (!isValid) {
			throw new AppError(400, 'Invalid reset code', 'INVALID_RESET_CODE');
		}

		const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
			password: newPassword,
		});

		if (updateError) {
			logger.error('Failed to update password', {
				userId: user.id,
				error: updateError,
			});
			throw new AppError(500, 'Failed to update password', 'PASSWORD_UPDATE_ERROR');
		}

		const clearData: UserProfileUpdate = {
			password_reset_code: null,
			password_reset_code_expires_at: null,
		};

		const { error: clearError } = await supabaseAdmin
			.from('user_profiles')
			.update(clearData)
			.eq('id', user.id);

		if (clearError) {
			logger.error('Failed to clear reset code', {
				userId: user.id,
				error: clearError.message,
			});
		}

		await this.rateLimiter.reset(attemptsKey);

		logger.info('Password reset successful', { userId: user.id });
	}
}
