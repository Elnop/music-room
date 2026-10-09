import { RateLimiterService } from '@/shared/services/rate-limiter.service.js';

/**
 * Limits on requesting password reset codes, per email and IP: at most
 * MAX_REQUESTS_PER_HOUR forgot-password requests per hour, and a
 * RESEND_COOLDOWN_SECONDS cooldown after each one. Both apply whether the
 * email belongs to an account or not, so neither reveals which emails exist.
 */
export class PasswordResetCooldownService {
	private readonly MAX_REQUESTS_PER_HOUR = 3;
	private readonly RESEND_COOLDOWN_SECONDS = 60;
	private rateLimiter = new RateLimiterService();

	/**
	 * Count a forgot-password request: 429 RATE_LIMIT_EXCEEDED past the hourly
	 * limit, then start the resend cooldown.
	 */
	async consumeRequest(email: string, ip: string): Promise<void> {
		await this.rateLimiter.incrementAndCheck(this.requestKey(email, ip), {
			maxAttempts: this.MAX_REQUESTS_PER_HOUR,
			windowSeconds: 60 * 60,
		});
		await this.rateLimiter.increment(this.resendKey(email, ip), {
			maxAttempts: 1,
			windowSeconds: this.RESEND_COOLDOWN_SECONDS,
		});
	}

	/**
	 * Whether a new forgot-password request would be accepted, and if not the
	 * real time left (Redis TTL) of whichever limit blocks it.
	 */
	async status(
		email: string,
		ip: string
	): Promise<{ canResend: boolean; remainingSeconds: number }> {
		const hourly = await this.rateLimiter.checkLimit(this.requestKey(email, ip), {
			maxAttempts: this.MAX_REQUESTS_PER_HOUR,
			windowSeconds: 60 * 60,
		});
		if (!hourly.canProceed) {
			return { canResend: false, remainingSeconds: hourly.remainingSeconds ?? 0 };
		}

		const cooldown = await this.rateLimiter.checkLimit(this.resendKey(email, ip), {
			maxAttempts: 1,
			windowSeconds: this.RESEND_COOLDOWN_SECONDS,
		});
		return {
			canResend: cooldown.canProceed,
			remainingSeconds: cooldown.canProceed ? 0 : (cooldown.remainingSeconds ?? 0),
		};
	}

	private requestKey(email: string, ip: string): string {
		return `password_reset_request:${email.trim().toLowerCase()}:${ip}`;
	}

	private resendKey(email: string, ip: string): string {
		return `password_reset_resend:${email.trim().toLowerCase()}:${ip}`;
	}
}
