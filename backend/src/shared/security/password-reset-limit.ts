import * as attemptLimit from '@/shared/security/attempt-limit.js';

/**
 * Limits on requesting password reset codes, per email and IP: at most
 * MAX_REQUESTS_PER_HOUR forgot-password requests per hour, and a
 * RESEND_COOLDOWN_SECONDS cooldown after each one. Both apply whether the
 * email belongs to an account or not, so neither reveals which emails exist.
 */

const HOURLY = { maxAttempts: 3, windowSeconds: 60 * 60 };
const COOLDOWN = { maxAttempts: 1, windowSeconds: 60 };

function requestKey(email: string, ip: string): string {
	return `password_reset_request:${email.trim().toLowerCase()}:${ip}`;
}

function resendKey(email: string, ip: string): string {
	return `password_reset_resend:${email.trim().toLowerCase()}:${ip}`;
}

/**
 * Count a forgot-password request: 429 RATE_LIMIT_EXCEEDED past the hourly
 * limit, then start the resend cooldown.
 */
export async function consumeRequest(email: string, ip: string): Promise<void> {
	await attemptLimit.incrementAndCheck(requestKey(email, ip), HOURLY);
	await attemptLimit.increment(resendKey(email, ip), COOLDOWN);
}

/**
 * Whether a new forgot-password request would be accepted, and if not the
 * real time left (Redis TTL) of whichever limit blocks it.
 */
export async function status(
	email: string,
	ip: string
): Promise<{ canResend: boolean; remainingSeconds: number }> {
	const hourly = await attemptLimit.checkLimit(requestKey(email, ip), HOURLY);
	if (!hourly.canProceed) {
		return { canResend: false, remainingSeconds: hourly.remainingSeconds ?? 0 };
	}

	const cooldown = await attemptLimit.checkLimit(resendKey(email, ip), COOLDOWN);
	return {
		canResend: cooldown.canProceed,
		remainingSeconds: cooldown.canProceed ? 0 : (cooldown.remainingSeconds ?? 0),
	};
}
