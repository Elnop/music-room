import crypto from 'crypto';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import * as mailService from '@/features/mail/services/mail.service.js';
import * as attemptLimit from '@/shared/security/attempt-limit.js';
import { verificationConfig } from '@/features/mail/mail.config.js';

export async function generateAndStore(userId: string): Promise<string> {
	const code = crypto.randomInt(100000, 999999).toString();
	const expiresAt = new Date(Date.now() + verificationConfig.expiryMinutes * 60 * 1000);

	const { error } = await supabaseAdmin
		.from('user_profiles')
		.update({
			verification_code: code,
			verification_code_expires_at: expiresAt.toISOString(),
		})
		.eq('id', userId);

	if (error) {
		logger.error('Failed to store verification code', { userId, error });
		throw new AppError(500, 'Failed to store verification code', 'CODE_STORE_ERROR');
	}

	logger.info('Verification code stored', { userId, expiresAt: expiresAt.toISOString() });
	return code;
}

export async function sendCode(email: string, code: string): Promise<void> {
	await mailService.sendVerificationEmail(email, code, verificationConfig.expiryMinutes);
}

/** Enforces the attempts limit and the expiry before marking the email verified. */
export async function verifyCode(userId: string, code: string, ip: string): Promise<void> {
	const attemptsKey = `email_verify_attempts:${userId}:${ip}`;

	await attemptLimit.incrementAndCheck(attemptsKey, {
		maxAttempts: verificationConfig.maxAttempts,
		windowSeconds: verificationConfig.expiryMinutes * 60,
	});

	const { data: profile, error } = await supabaseAdmin
		.from('user_profiles')
		.select('verification_code, verification_code_expires_at, email_verified')
		.eq('id', userId)
		.single();

	if (error || !profile) {
		throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
	}

	// Already verified: refuse, so a session is never minted without a valid code
	if (profile.email_verified) {
		logger.warn('Verification attempt on an already verified account', { userId, ip });
		throw new AppError(400, 'Email already verified', 'ALREADY_VERIFIED');
	}

	if (!profile.verification_code || !profile.verification_code_expires_at) {
		throw new AppError(
			400,
			'No verification code found. Please request a new code.',
			'NO_CODE_FOUND'
		);
	}

	if (new Date(profile.verification_code_expires_at) < new Date()) {
		throw new AppError(
			400,
			'Verification code expired. Please request a new code.',
			'CODE_EXPIRED'
		);
	}

	// Constant-time comparison against timing attacks
	const isValid = crypto.timingSafeEqual(Buffer.from(profile.verification_code), Buffer.from(code));

	if (!isValid) {
		logger.warn('Invalid verification code', { userId, ip });
		throw new AppError(400, 'Invalid verification code', 'INVALID_CODE');
	}

	const { error: updateError } = await supabaseAdmin
		.from('user_profiles')
		.update({
			email_verified: true,
			verification_code: null,
			verification_code_expires_at: null,
		})
		.eq('id', userId);

	if (updateError) {
		logger.error('Failed to mark email as verified', { userId, error: updateError });
		throw new AppError(500, 'Verification failed', 'VERIFICATION_ERROR');
	}

	await attemptLimit.reset(attemptsKey);

	logger.info('Email verified successfully', { userId });
}

/** Cooldown (429 RESEND_COOLDOWN), then an hourly cap (429 RESEND_LIMIT_EXCEEDED); records allowed attempts. */
export async function consumeResend(userId: string, ip: string): Promise<void> {
	const cooldown = { maxAttempts: 1, windowSeconds: verificationConfig.resendCooldownSeconds };
	const cooldownKey = `email_resend:${userId}:${ip}`;
	const countKey = `email_resend_count:${userId}:${ip}`;

	const { canProceed, remainingSeconds } = await attemptLimit.checkLimit(cooldownKey, cooldown);
	if (!canProceed) {
		throw new AppError(
			429,
			`Please wait ${remainingSeconds} seconds before requesting a new code`,
			'RESEND_COOLDOWN'
		);
	}
	if ((await attemptLimit.getAttempts(countKey)) >= verificationConfig.maxResends) {
		throw new AppError(
			429,
			'Too many resend attempts. Please try again later.',
			'RESEND_LIMIT_EXCEEDED'
		);
	}

	await attemptLimit.increment(cooldownKey, cooldown);
	await attemptLimit.increment(countKey, {
		maxAttempts: verificationConfig.maxResends,
		windowSeconds: 3600,
	});
	logger.info('Resend attempt recorded', { userId, ip });
}
