import { rateLimitConfig } from '@/shared/config/rate-limit.config.js';
import { logger } from '@/shared/utils/logger.js';
import * as counter from '@/shared/security/counter.js';
import { failOpen } from '@/shared/security/fail-open.js';
import type { LockoutStatus } from '@/shared/security/security.types.js';

// The lock duration grows with the failed attempt count (soft, hard, severe). Fails open.

const FAILED_WINDOW_MS = 15 * 60 * 1000;

const failedKey = (email: string, ip: string) => `failed_login:${email}:${ip}`;
const lockKey = (email: string, ip: string) => `account_locked:${email}:${ip}`;

function notLocked(): LockoutStatus {
	const { threshold } = rateLimitConfig.lockout;
	return { isLocked: false, failedAttempts: 0, remainingAttempts: threshold };
}

const disabledStatus: LockoutStatus = {
	isLocked: false,
	failedAttempts: 0,
	remainingAttempts: Infinity,
};

async function lockAccount(email: string, ip: string, attempts: number): Promise<LockoutStatus> {
	const { durationSevere, durationHard, durationSoft } = rateLimitConfig.lockout;
	const [lockDuration, severity] =
		attempts >= 10
			? [durationSevere, 'severe']
			: attempts >= 8
				? [durationHard, 'hard']
				: [durationSoft, 'soft'];

	try {
		await counter.setFlag(lockKey(email, ip), lockDuration, attempts.toString());
	} catch (error) {
		logger.error('Error locking account', {
			error: error instanceof Error ? error.message : 'Unknown error',
			email,
			ip,
		});
		return { isLocked: false, failedAttempts: attempts };
	}

	const lockedUntil = new Date(Date.now() + lockDuration * 1000);
	logger.warn('Account locked', {
		email,
		ip,
		attempts,
		severity,
		lockDuration,
		lockedUntil: lockedUntil.toISOString(),
	});
	return { isLocked: true, lockedUntil, remainingSeconds: lockDuration, failedAttempts: attempts };
}

export async function recordFailedAttempt(email: string, ip: string): Promise<LockoutStatus> {
	return failOpen(
		{
			disabled: 'Brute force protection disabled (development mode)',
			unavailable: 'Brute force protection unavailable - Redis not connected',
			unavailableLevel: 'error',
			failed: 'Error recording failed attempt',
			whenDisabled: disabledStatus,
			fallback: notLocked(),
		},
		{ email, ip },
		async () => {
			const { threshold } = rateLimitConfig.lockout;
			const { count: attempts } = await counter.hit(failedKey(email, ip), FAILED_WINDOW_MS);
			logger.info('Failed login attempt recorded', { email, ip, attempts, threshold });

			if (attempts >= threshold) return lockAccount(email, ip, attempts);
			return { isLocked: false, failedAttempts: attempts, remainingAttempts: threshold - attempts };
		}
	);
}

/** After a successful login. */
export async function resetFailedAttempts(email: string, ip: string): Promise<void> {
	await failOpen(
		{
			disabled: 'Brute force protection disabled - skip reset',
			unavailable: 'Cannot reset failed attempts - Redis not connected',
			failed: 'Error resetting failed attempts',
			fallback: undefined,
		},
		{ email, ip },
		async () => {
			const [deletedFailed, deletedLock] = await Promise.all([
				counter.clear(failedKey(email, ip)),
				counter.clear(lockKey(email, ip)),
			]);
			if (deletedFailed > 0 || deletedLock > 0) {
				logger.info('Failed attempts reset', { email, ip, deletedFailed, deletedLock });
			}
		}
	);
}

export async function checkLockout(email: string, ip: string): Promise<LockoutStatus> {
	return failOpen(
		{
			disabled: 'Account lockout disabled (development mode)',
			unavailable: 'Cannot check lockout - Redis not connected',
			failed: 'Error checking lockout status',
			whenDisabled: disabledStatus,
			fallback: notLocked(),
		},
		{ email, ip },
		async () => {
			const [lock, failed] = await Promise.all([
				counter.readFlag(lockKey(email, ip)),
				counter.peek(failedKey(email, ip)),
			]);
			const failedAttempts = failed.count;

			if (lock.isSet && lock.ttlSeconds > 0) {
				return {
					isLocked: true,
					lockedUntil: new Date(Date.now() + lock.ttlSeconds * 1000),
					remainingSeconds: lock.ttlSeconds,
					failedAttempts,
				};
			}
			const remainingAttempts = rateLimitConfig.lockout.threshold - failedAttempts;
			return { isLocked: false, failedAttempts, remainingAttempts };
		}
	);
}
