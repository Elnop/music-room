import crypto from 'crypto';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import * as mailService from '@/features/mail/services/mail.service.js';
import { RateLimiterService } from '@/shared/services/rate-limiter.service.js';
import { PasswordResetCooldownService } from '@/features/auth/services/password-reset-cooldown.service.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { findAuthUserIdByEmail } from '@/features/auth/utils/find-auth-user.js';
import type { UserProfileUpdate } from '@/features/auth/auth.types.js';

const rateLimiter = new RateLimiterService();
const cooldown = new PasswordResetCooldownService();

const CODE_EXPIRY_MINUTES = 15;
const MAX_RESET_ATTEMPTS = 5;

async function storeResetCode(userId: string, code: string): Promise<void> {
	const expiresAt = new Date();
	expiresAt.setMinutes(expiresAt.getMinutes() + CODE_EXPIRY_MINUTES);

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

export async function requestPasswordReset(email: string, ip: string): Promise<void> {
	// Hourly limit and resend cooldown, whether the email exists or not (#187).
	await cooldown.consumeRequest(email, ip);

	const userId = await findAuthUserIdByEmail(email);

	if (!userId) {
		logger.warn('Password reset requested for non-existent email', {
			email,
			ip,
		});
		return;
	}

	// An account without a password (Google or Facebook only) also gets a code:
	// resetting adds email/password sign-in to it (#189).
	const code = crypto.randomInt(100000, 999999).toString();
	await storeResetCode(userId, code);

	await mailService.sendPasswordResetEmail(email, code, CODE_EXPIRY_MINUTES);

	logger.info('Password reset email sent', { email, userId });
}

export async function resetPassword(
	email: string,
	code: string,
	newPassword: string,
	ip: string
): Promise<void> {
	// Normalized: the lookup ignores case, so must the attempts limit.
	const attemptsKey = `password_reset_attempts:${email.trim().toLowerCase()}:${ip}`;
	await rateLimiter.incrementAndCheck(attemptsKey, {
		maxAttempts: MAX_RESET_ATTEMPTS,
		windowSeconds: 15 * 60,
	});

	const userId = await findAuthUserIdByEmail(email);

	if (!userId) {
		throw new AppError(400, 'Invalid reset code', 'INVALID_RESET_CODE');
	}

	const { data: profile, error: profileError } = await supabaseAdmin
		.from('user_profiles')
		.select('password_reset_code, password_reset_code_expires_at')
		.eq('id', userId)
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

	// Supabase Auth deletes every session of the account when an admin sets its
	// password, so stolen access and refresh tokens stop working (#203, tested
	// in password-reset-sessions.int.test.ts).
	const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
		password: newPassword,
	});

	if (updateError) {
		logger.error('Failed to update password', {
			userId: userId,
			error: updateError,
		});
		throw new AppError(500, 'Failed to update password', 'PASSWORD_UPDATE_ERROR');
	}

	// The account now has a password, even if it was Google or Facebook only (#189).
	const clearData: UserProfileUpdate = {
		password_reset_code: null,
		password_reset_code_expires_at: null,
		has_password: true,
	};

	const { error: clearError } = await supabaseAdmin
		.from('user_profiles')
		.update(clearData)
		.eq('id', userId);

	if (clearError) {
		logger.error('Failed to clear reset code and set has_password', {
			userId: userId,
			error: clearError.message,
		});
		// The password is set but has_password would stay false: fail so the client
		// retries (the code is still stored) instead of leaving the account wrong.
		throw new AppError(500, 'Failed to update password', 'PASSWORD_UPDATE_ERROR');
	}

	await rateLimiter.reset(attemptsKey);

	logger.info('Password reset successful', { userId: userId });
}
