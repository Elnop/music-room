import * as attemptLimit from '@/shared/security/attempt-limit.js';

// Both limits apply whether the email belongs to an account or not, so neither reveals which emails exist.

const HOURLY = { maxAttempts: 3, windowSeconds: 60 * 60 };
const COOLDOWN = { maxAttempts: 1, windowSeconds: 60 };

function requestKey(email: string, ip: string): string {
	return `password_reset_request:${email.trim().toLowerCase()}:${ip}`;
}

function resendKey(email: string, ip: string): string {
	return `password_reset_resend:${email.trim().toLowerCase()}:${ip}`;
}

export async function consumeRequest(email: string, ip: string): Promise<void> {
	await attemptLimit.incrementAndCheck(requestKey(email, ip), HOURLY);
	await attemptLimit.increment(resendKey(email, ip), COOLDOWN);
}

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
