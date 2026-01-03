import crypto from 'crypto';
import { supabase } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { sendVerificationEmail } from '@/features/mail/mail.service.js';
import { RateLimiterService } from '@/shared/services/rate-limiter.service.js';
import { verificationConfig } from '@/features/mail/mail.config.js';

/**
 * Email verification service for managing verification codes
 *
 * Handles code generation, storage, and verification logic.
 * Delegates email sending and rate limiting to service functions.
 */
export class EmailVerificationService {
	private readonly rateLimiter: RateLimiterService;
	private readonly CODE_LENGTH = verificationConfig.codeLength;
	private readonly CODE_EXPIRY_MINUTES = verificationConfig.expiryMinutes;
	private readonly MAX_VERIFICATION_ATTEMPTS = verificationConfig.maxAttempts;
	private readonly MAX_RESEND_ATTEMPTS = verificationConfig.maxResends;
	private readonly RESEND_COOLDOWN_SECONDS = verificationConfig.resendCooldownSeconds;

	constructor() {
		this.rateLimiter = new RateLimiterService();
	}

	/**
	 * Generate cryptographically secure 6-digit verification code
	 */
	generateVerificationCode(): string {
		const code = crypto.randomInt(100000, 999999).toString();
		return code;
	}

	/**
	 * Store verification code in database with expiration
	 */
	async storeVerificationCode(userId: string, code: string): Promise<void> {
		const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000);

		const { error } = await supabase
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

		logger.info('Verification code stored', {
			userId,
			expiresAt: expiresAt.toISOString(),
		});
	}

	/**
	 * Send verification email with code
	 */
	async sendVerificationEmail(email: string, code: string): Promise<void> {
		await sendVerificationEmail(email, code, this.CODE_EXPIRY_MINUTES);
	}

	/**
	 * Verify code with rate limiting and expiration check
	 */
	async verifyCode(userId: string, code: string, ip: string): Promise<boolean> {
		// Check rate limiting
		const attemptsKey = `email_verify_attempts:${userId}:${ip}`;

		await this.rateLimiter.incrementAndCheck(attemptsKey, {
			maxAttempts: this.MAX_VERIFICATION_ATTEMPTS,
			windowSeconds: this.CODE_EXPIRY_MINUTES * 60,
		});

		// Fetch stored code from database
		const { data: profile, error } = await supabase
			.from('user_profiles')
			.select('verification_code, verification_code_expires_at, email_verified')
			.eq('id', userId)
			.single();

		if (error || !profile) {
			throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
		}

		// Already verified
		if (profile.email_verified) {
			logger.info('User already verified', { userId });
			return true;
		}

		// No code stored
		if (!profile.verification_code || !profile.verification_code_expires_at) {
			throw new AppError(
				400,
				'No verification code found. Please request a new code.',
				'NO_CODE_FOUND'
			);
		}

		// Check expiration
		if (new Date(profile.verification_code_expires_at) < new Date()) {
			throw new AppError(
				400,
				'Verification code expired. Please request a new code.',
				'CODE_EXPIRED'
			);
		}

		// Verify code using constant-time comparison to prevent timing attacks
		const isValid = crypto.timingSafeEqual(
			Buffer.from(profile.verification_code),
			Buffer.from(code)
		);

		if (!isValid) {
			logger.warn('Invalid verification code', { userId, ip });
			throw new AppError(400, 'Invalid verification code', 'INVALID_CODE');
		}

		// Mark as verified and clear code
		const { error: updateError } = await supabase
			.from('user_profiles')
			.update({
				email_verified: true,
				verification_code: null,
				verification_code_expires_at: null,
			})
			.eq('id', userId);

		if (updateError) {
			logger.error('Failed to mark email as verified', {
				userId,
				error: updateError,
			});
			throw new AppError(500, 'Verification failed', 'VERIFICATION_ERROR');
		}

		// Clear rate limit attempts on success
		await this.rateLimiter.reset(attemptsKey);

		logger.info('Email verified successfully', { userId });
		return true;
	}

	/**
	 * Check if user can resend verification code (rate limiting)
	 */
	async canResendCode(
		userId: string,
		ip: string
	): Promise<{ canResend: boolean; remainingSeconds?: number }> {
		const cooldownKey = `email_resend:${userId}:${ip}`;
		const countKey = `email_resend_count:${userId}:${ip}`;

		// Check cooldown (60 seconds between resends)
		const cooldownResult = await this.rateLimiter.checkLimit(cooldownKey, {
			maxAttempts: 1,
			windowSeconds: this.RESEND_COOLDOWN_SECONDS,
		});

		if (!cooldownResult.canProceed) {
			return {
				canResend: false,
				remainingSeconds: cooldownResult.remainingSeconds,
			};
		}

		// Check resend count (max 3 per hour)
		const attempts = await this.rateLimiter.getAttempts(countKey);
		if (attempts >= this.MAX_RESEND_ATTEMPTS) {
			throw new AppError(
				429,
				`Too many resend attempts. Please try again later.`,
				'RESEND_LIMIT_EXCEEDED'
			);
		}

		return { canResend: true };
	}

	/**
	 * Record resend attempt (for rate limiting)
	 */
	async recordResendAttempt(userId: string, ip: string): Promise<void> {
		const cooldownKey = `email_resend:${userId}:${ip}`;
		const countKey = `email_resend_count:${userId}:${ip}`;

		// Set cooldown (60 seconds)
		await this.rateLimiter.increment(cooldownKey, {
			maxAttempts: 1,
			windowSeconds: this.RESEND_COOLDOWN_SECONDS,
		});

		// Increment resend count (1 hour window)
		await this.rateLimiter.increment(countKey, {
			maxAttempts: this.MAX_RESEND_ATTEMPTS,
			windowSeconds: 3600,
		});

		logger.info('Resend attempt recorded', { userId, ip });
	}

	/**
	 * Generate and store verification code (convenience method)
	 */
	async generateAndStore(userId: string): Promise<string> {
		const code = this.generateVerificationCode();
		await this.storeVerificationCode(userId, code);
		return code;
	}
}
